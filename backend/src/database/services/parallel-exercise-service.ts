import type {
    UUID,
    EvalResult,
    ParallelExerciseId,
    SetAutojoinViewportAction,
    ParallelExerciseKey,
    ExerciseId,
    ExerciseAction,
} from 'fuesim-digital-shared';
import {
    getEvalResultsByActionHistory,
    parallelExerciseInstanceSummarySchema,
    updateEvalResultsMap,
} from 'fuesim-digital-shared';
import type { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ParallelExercise, ParallelExerciseInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
import type { ExerciseManagerService } from './exercise-manager-service.js';
import type { ExerciseService } from './exercise-service.js';
import { ActionRepository } from '../repositories/action-repository.js';

export interface ParallelExerciseJoin {
    parallelExerciseId: ParallelExerciseId;
    activeExercise: ActiveExercise;
}
export class ParallelExerciseService {
    public newJoin = new Subject<ParallelExerciseJoin>();
    private readonly subscriptions: { [key: ExerciseId]: Subscription } = {};
    public evalResultsMap: {
        [exerciseId: ExerciseId]: {
            [criterionId: UUID]: EvalResult;
        };
    } = {};
    public constructor(
        private readonly parallelExerciseRepository: ParallelExerciseRepository,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService,
        private readonly actionRepository: ActionRepository
    ) {
        this.newJoin.subscribe((join) => {
            if (!this.subscriptions[join.activeExercise.exercise.id]) {
                this.evalResultsMap[join.activeExercise.exercise.id] = {};
                const sub = join.activeExercise.tickApplied.subscribe(
                    async () => {
                        const id = join.activeExercise.exercise.id;
                        const state = join.activeExercise.getStateSnapshot();
                        const previousResults = this.evalResultsMap[id];
                        this.evalResultsMap[id] = updateEvalResultsMap(
                            previousResults ?? {},
                            state.evalCriteria,
                            state.technicalChallenges,
                            state.patients,
                            state.scoutables,
                            state.currentTime,
                            false
                        );
                    }
                );
                this.subscriptions[join.activeExercise.exercise.id] = sub;
            }
        });
    }
    public async initEvalResultsMap(exercises: ActiveExercise[]) {
        exercises.forEach(async (exercise) => {
            const exerciseId = exercise.exercise.id;
            const actionsDetailed =
                await this.actionRepository.getActionsForExerciseId(exerciseId);
            console.log(
                actionsDetailed
                    ? 'action history found'
                    : 'action history undefined'
            );
            const actions = actionsDetailed.map(
                (action) => action.actionString
            );
            const initialState = exercise.exercise.initialStateString;
            const results = getEvalResultsByActionHistory(
                actions,
                initialState
            );
            this.evalResultsMap[exerciseId] = results;
        });
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

        this.newJoin.next({
            parallelExerciseId: parallelExercise.id,
            activeExercise: exercise,
        });
        return exercise;
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

    public async getParallelExerciseInstanceSummaries(
        exercises: ActiveExercise[]
    ) {
        let isComplete = true;
        exercises.forEach((exercise) => {
            if (!this.evalResultsMap[exercise.exercise.id]) {
                isComplete = false;
            }
        });
        if (!isComplete) {
            await this.initEvalResultsMap(exercises);
        }
        return exercises.map((exercise) => {
            let incomplete = false;
            const state = exercise.exercise.currentStateString;
            let evalResults: { [criterionId: UUID]: EvalResult };
            if (this.evalResultsMap[exercise.exercise.id]) {
                evalResults = this.evalResultsMap[exercise.exercise.id]!;
            } else {
                incomplete = true;
            }
            return parallelExerciseInstanceSummarySchema.parse({
                participantKey: exercise.participantKey,
                trainerKey: exercise.trainerKey,
                clientNames: state.collectedClientNames,
                currentTime: state.currentTime,
                currentStatus: state.currentStatus,
                lastLogEntry: state.lastLogEntry,
                evalResults: this.evalResultsMap[exercise.exercise.id] ?? {},
                isActive: Object.values(state.clients).some(
                    (client) =>
                        client.role.mainRole === 'participant' &&
                        client.isActive
                ),
            });
        });
    }
}
