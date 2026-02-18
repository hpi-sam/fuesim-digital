import type { GroupParticipantKey } from 'fuesim-digital-shared';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ParallelExerciseId, ParallelExerciseInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { AccessKeyService } from './access-key-service.js';

export class ParallelExerciseService {
    public constructor(
        private readonly parallelExerciseRepository: ParallelExerciseRepository,
        private readonly accessKeyService: AccessKeyService
    ) {}

    public async generateParticipantKey() {
        return (await this.accessKeyService.generateKey(
            7
        )) as GroupParticipantKey;
    }

    public async getParallelExercisesOfOwner(session: SessionInformation) {
        return this.parallelExerciseRepository.getParallelExercisesOfOwner(
            session.user.id
        );
    }

    public async getParallelExerciseById(
        id: ParallelExerciseId,
        session: SessionInformation
    ) {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(id);
        if (!parallelExercise) {
            throw new NotFoundError();
        }
        if (parallelExercise.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        return parallelExercise;
    }
    public async createParallelExercise(
        data: Pick<ParallelExerciseInsert, 'joinViewportId' | 'templateId'>,
        session: SessionInformation
    ) {
        const created =
            await this.parallelExerciseRepository.createParallelExercise({
                ...data,
                participantKey: await this.generateParticipantKey(),
                user: session.user.id,
            });
        if (!created) {
            throw new ApiError();
        }
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(
                created.id
            );
        return parallelExercise!;
    }

    public async deleteParallelExercise(
        id: ParallelExerciseId,
        session: SessionInformation
    ) {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(id);
        if (!parallelExercise) {
            throw new NotFoundError();
        }
        if (parallelExercise.user !== session.user.id) {
            throw new PermissionDeniedError();
        }

        await this.parallelExerciseRepository.deleteParallelExerciseById(id);
        await this.accessKeyService.free(parallelExercise.participantKey);
    }
}
