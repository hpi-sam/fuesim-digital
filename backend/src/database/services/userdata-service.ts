import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import type { SessionRepository } from '../repositories/session-repository.js';
import type { UserRepository } from '../repositories/user-repository.js';

export class UserDataService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly userRepository: UserRepository,
        private readonly parallelExerciseRepository: ParallelExerciseRepository,
        private readonly organisationRepository: OrganisationRepository
    ) {}

    public async getUserDataDump(userId: string): Promise<any> {
        const user = await this.userRepository.getUserById(userId);

        if (user === null) return {};

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

        return {
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
    }
}
