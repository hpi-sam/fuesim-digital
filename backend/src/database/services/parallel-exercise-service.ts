import type {
    GroupParticipantKey,
    SetAutojoinViewportAction,
} from 'fuesim-digital-shared';
import { parallelExerciseInstanceSummarySchema } from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ParallelExerciseId, ParallelExerciseInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import type { AccessKeyService } from './access-key-service.js';
import type { ExerciseManagerService } from './exercise-manager-service.js';
import type { ExerciseService } from './exercise-service.js';

export interface ParallelExerciseJoin {
    parallelExerciseId: ParallelExerciseId;
    activeExercise: ActiveExercise;
}
export class ParallelExerciseService {
    public newJoin = new Subject<ParallelExerciseJoin>();
    public constructor(
        private readonly parallelExerciseRepository: ParallelExerciseRepository,
        private readonly accessKeyService: AccessKeyService,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService
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

    public async getParallelExerciseByParticipantKey(
        key: GroupParticipantKey,
        session: SessionInformation
    ) {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseByParticipantKey(
                key
            );
        if (!parallelExercise) {
            throw new NotFoundError();
        }
        return parallelExercise;
    }

    public async joinParallelExerciseByParticipantKey(
        key: GroupParticipantKey
    ) {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseByParticipantKey(
                key
            );
        if (!parallelExercise) {
            throw new NotFoundError();
        }

        const exercise =
            await this.exerciseManagerService.createExerciseFromTemplate(
                parallelExercise.template.id,
                undefined,
                { parallelExerciseId: parallelExercise.id }
            );

        const setAutojoinViewportAction: SetAutojoinViewportAction = {
            type: '[Exercise] Set autojoin viewport',
            viewportId: parallelExercise.joinViewportId,
        };
        exercise.applyAction(setAutojoinViewportAction, null);

        this.newJoin.next({
            parallelExerciseId: parallelExercise.id,
            activeExercise: exercise,
        });
        return exercise;
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

    public async getParallelExerciseInstancesById(
        id: ParallelExerciseId,
        session: SessionInformation
    ) {
        const parallelExercise = await this.getParallelExerciseById(
            id,
            session
        );
        const exerciseInstances =
            await this.parallelExerciseRepository.getParallelExerciseInstancesById(
                parallelExercise.id
            );
        const activeExercises = exerciseInstances.map((exerciseEntry) =>
            this.exerciseService.getExerciseByKey(exerciseEntry.participantKey)
        );
        return activeExercises;
    }

    public async getParallelExerciseInstanceSummariesById(
        id: ParallelExerciseId,
        session: SessionInformation
    ) {
        const activeExercises = await this.getParallelExerciseInstancesById(
            id,
            session
        );
        return activeExercises.map((exercise) => {
            const state = exercise.getExercise().currentStateString;
            return parallelExerciseInstanceSummarySchema.parse({
                participantKey: exercise.participantKey,
                trainerKey: exercise.trainerKey,
                clientName: Object.values(state.clients)[0]?.name ?? '',
                currentTime: state.currentTime,
                currentStatus: state.currentStatus,
            });
        });
    }
}
