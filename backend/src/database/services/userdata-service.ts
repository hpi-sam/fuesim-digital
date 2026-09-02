import { ZipArchive } from 'archiver';
import type { GetUserDataDumpDataInput } from 'fuesim-digital-shared';
import {
    getKeyForUploadedImage,
    getUserDataDumpDataSchema,
} from 'fuesim-digital-shared';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import type { SessionRepository } from '../repositories/session-repository.js';
import type { UserRepository } from '../repositories/user-repository.js';
import type { CollectionRepository } from '../repositories/collection-repository.js';
import type { S3Service } from '../../s3/s3-service.js';
import { NotFoundError } from '../../utils/http.js';

export class UserDataService {
    public constructor(
        private readonly s3Service: S3Service,
        private readonly exerciseRepository: ExerciseRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly userRepository: UserRepository,
        private readonly parallelExerciseRepository: ParallelExerciseRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly collectionRepository: CollectionRepository
    ) {}

    public async getUserDataDumpArchive(userId: string) {
        const archive = new ZipArchive();

        // Get JSON data and add them to archive
        const jsonData = await this.getUserDataDump(userId);
        const jsonBuffer = Buffer.from(JSON.stringify(jsonData));
        archive.append(jsonBuffer, { name: 'data.json' });

        // Get uploaded images and add them to archive
        const uploadedImages =
            await this.collectionRepository.getAllElementsOfTypeOfUser(
                userId,
                'uploadedImage'
            );
        for (const uploadedImage of uploadedImages) {
            // eslint-disable-next-line no-await-in-loop
            const buffer = await this.s3Service.getFile(
                getKeyForUploadedImage(uploadedImage.entityId)
            );
            if (!buffer) continue;
            archive.append(
                // eslint-disable-next-line no-await-in-loop
                Buffer.from(await buffer.transformToByteArray()),
                {
                    name: uploadedImage.entityId,
                }
            );
        }

        await archive.finalize();

        const filename = `fuesim-digital-userdata-${jsonData.user.username}.zip`;

        return { archive, filename };
    }

    public async getUserDataDump(
        userId: string
    ): Promise<GetUserDataDumpDataInput> {
        const user = await this.userRepository.getUserById(userId);

        if (!user) {
            throw new NotFoundError();
        }

        const exercises =
            await this.exerciseRepository.getAllExercisesForUser(userId);

        const exerciseTemplates =
            await this.exerciseRepository.getAllExerciseTemplatesForUser(
                userId
            );

        const sessions = (
            await this.sessionRepository.getAllSessionsByUser(userId)
        ).map((ses) => ({
            createdAt: ses.createdAt,
            expiresAt: ses.expiresAt,
        }));

        const parallelExercises =
            await this.parallelExerciseRepository.getParallelExercisesForUser(
                userId
            );

        const organisations = (
            await this.organisationRepository.getOrganisationsForUser(userId, [
                'admin',
                'editor',
                'viewer',
            ])
        ).map(({ id, name, description, userRole }) => ({
            id,
            name,
            description,
            userRole,
        }));

        const data = {
            user: {
                id: user.id,
                displayName: user.displayName,
                username: user.username,
            },
            sessions,
            organisations,
            exercises,
            exerciseTemplates,
            parallelExercises,
        };

        return getUserDataDumpDataSchema.encode(data);
    }
}
