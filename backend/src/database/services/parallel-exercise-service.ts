import type {
    ParallelExerciseId,
    SetAutojoinViewportAction,
    ParallelExerciseKey,
} from 'fuesim-digital-shared';
import { parallelExerciseInstanceSummarySchema } from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ParallelExercise, ParallelExerciseInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import { fastForwardExercise } from '../../exercise/fast-forward-exercise.js';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
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
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService
    ) {}

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

    public async getParallelExerciseByParticipantKey(key: ParallelExerciseKey) {
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
        key: ParallelExerciseKey
    ) {
        const parallelExercise =
            await this.getParallelExerciseByParticipantKey(key);

        const referenceInstance = await this.getMostProgressedStartedInstance(
            parallelExercise.id
        );

        // if (
        //     referenceInstance &&
        //     referenceInstance.exercise.currentStateString.currentTime >
        //         MAX_FAST_FORWARD_DURATION_MS
        // ) {
        //     throw new ExerciseAlreadyStartedError();
        // }

        const exercise =
            await this.exerciseManagerService.createExerciseFromTemplate(
                parallelExercise.template.id,
                'parallel',
                undefined,
                { parallelExerciseId: parallelExercise.id }
            );

        const setAutojoinViewportAction: SetAutojoinViewportAction = {
            type: '[Exercise] Set autojoin viewport',
            viewportId: parallelExercise.joinViewportId,
        };
        exercise.applyAction(setAutojoinViewportAction, null);

        if (referenceInstance) {
            fastForwardExercise(
                exercise,
                referenceInstance.exercise.currentStateString.currentTime,
                referenceInstance.exercise.currentStateString.currentStatus
            );
        }

        this.newJoin.next({
            parallelExerciseId: parallelExercise.id,
            activeExercise: exercise,
        });
        return exercise;
    }

    /**
     * Returns the existing instance of {@link parallelExerciseId} with the
     * highest `currentTime` among those that have been started (i.e.
     * `currentStatus !== 'notStarted'`), or `null` if none have been started
     * yet.
     */
    private async getMostProgressedStartedInstance(
        parallelExerciseId: ParallelExerciseId
    ): Promise<ActiveExercise | null> {
        const instanceEntries =
            await this.parallelExerciseRepository.getParallelExerciseInstancesById(
                parallelExerciseId
            );
        const instances = await Promise.all(
            instanceEntries.map(async (entry) =>
                this.exerciseService.getExerciseByKey(entry.participantKey)
            )
        );
        return instances
            .filter(
                (instance) =>
                    instance.exercise.currentStateString.currentStatus !==
                    'notStarted'
            )
            .reduce<ActiveExercise | null>(
                (furthest, instance) =>
                    !furthest ||
                    instance.exercise.currentStateString.currentTime >
                        furthest.exercise.currentStateString.currentTime
                        ? instance
                        : furthest,
                null
            );
    }

    public async createParallelExercise(
        data: Pick<
            ParallelExerciseInsert,
            'joinViewportId' | 'name' | 'templateId'
        >,
        session: SessionInformation
    ): Promise<ParallelExercise> {
        return this.parallelExerciseRepository.transaction(async (tx) => {
            const created = await tx.createParallelExercise({
                ...data,
                participantKey: await new AccessKeyRepository(tx).generateKey(
                    7
                ),
                user: session.user.id,
            });
            if (!created) {
                throw new ApiError();
            }
            const parallelExercise = await tx.getParallelExerciseById(
                created.id
            );
            return parallelExercise!;
        });
    }

    public async updateParallelExercise(
        id: ParallelExerciseId,
        session: SessionInformation,
        data: Partial<ParallelExerciseInsert>
    ) {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(id);
        if (!parallelExercise) {
            throw new NotFoundError();
        }
        if (parallelExercise.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        await this.parallelExerciseRepository.updateParallelExercise(
            parallelExercise.id,
            data
        );
        const updatedParallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(
                parallelExercise.id
            );
        if (!updatedParallelExercise) {
            throw new ApiError();
        }
        return updatedParallelExercise;
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

        const exerciseInstances =
            await this.parallelExerciseRepository.getParallelExerciseInstancesById(
                parallelExercise.id
            );

        await Promise.all(
            exerciseInstances.map(async (exerciseEntry) =>
                this.exerciseService.deleteExercise(exerciseEntry.trainerKey)
            )
        );

        await this.parallelExerciseRepository.deleteParallelExerciseById(id);
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
        const activeExercises = await Promise.all(
            exerciseInstances.map(async (exerciseEntry) =>
                this.exerciseService.getExerciseByKey(
                    exerciseEntry.participantKey
                )
            )
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
        return this.getParallelExerciseInstanceSummaries(activeExercises);
    }

    public getParallelExerciseInstanceSummaries(exercises: ActiveExercise[]) {
        return exercises.map((exercise) => {
            const state = exercise.exercise.currentStateString;
            return parallelExerciseInstanceSummarySchema.parse({
                participantKey: exercise.participantKey,
                trainerKey: exercise.trainerKey,
                clientNames: state.collectedClientNames,
                currentTime: state.currentTime,
                currentStatus: state.currentStatus,
                lastLogEntry: state.lastLogEntry,
                isActive: Object.values(state.clients).some(
                    (client) =>
                        client.role.mainRole === 'participant' &&
                        client.isActive
                ),
            });
        });
    }
}
