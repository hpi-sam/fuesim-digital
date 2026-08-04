import type {
    UUID,
    EvalResult,
    ParallelExerciseId,
    SetAutojoinViewportAction,
    ParallelExerciseKey,
    ExerciseId,
    OrganisationId,
} from 'fuesim-digital-shared';
import {
    getEvalResultsByActionHistory,
    newEvalResultContext,
    parallelExerciseInstanceSummarySchema,
    updateEvalResultsMap,
} from 'fuesim-digital-shared';
import type { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import type { SessionInformation } from '../../auth/auth-service.js';
import type {
    ParallelExerciseInsert,
    ParallelExerciseDetailsEntryWithUserRole,
} from '../schema.js';
import {
    ApiError,
    ExerciseAlreadyStartedError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import {
    fastForwardExercise,
    MAX_FAST_FORWARD_DURATION_MS,
} from '../../exercise/fast-forward-exercise.js';
import type { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
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
        private readonly exerciseRepository: ExerciseRepository,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService,
        private readonly organisationRepository: OrganisationRepository,
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
                        const context = newEvalResultContext(
                            state.evalCriteria,
                            state.technicalChallenges,
                            state.patients,
                            state.scoutables,
                            state.measures,
                            state.currentTime
                        );
                        this.evalResultsMap[id] = updateEvalResultsMap(
                            previousResults ?? {},
                            context,
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

    public async getParallelExercisesForUser(
        session: SessionInformation,
        organisationId?: OrganisationId
    ): Promise<ParallelExerciseDetailsEntryWithUserRole[]> {
        if (organisationId) {
            const organisation =
                await this.organisationRepository.getOrganisationById(
                    organisationId
                );
            if (!organisation) {
                throw new PermissionDeniedError();
            }
            const userRole =
                await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                    organisationId,
                    session.user.id
                );
            if (!userRole) {
                throw new PermissionDeniedError();
            }
            return (
                await this.parallelExerciseRepository.getParallelExercisesForOrganisation(
                    organisationId
                )
            ).map((parallelExercise) => ({
                ...parallelExercise,
                userRole,
            }));
        }
        return this.parallelExerciseRepository.getParallelExercisesForUser(
            session.user.id
        );
    }

    public async getParallelExerciseById(
        id: ParallelExerciseId,
        session: SessionInformation
    ): Promise<ParallelExerciseDetailsEntryWithUserRole> {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(id);
        if (!parallelExercise) {
            throw new NotFoundError();
        }
        const userRole =
            await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                parallelExercise.organisationId,
                session.user.id
            );
        if (!userRole) {
            throw new PermissionDeniedError();
        }
        return { ...parallelExercise, userRole };
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

        if (
            referenceInstance &&
            referenceInstance.exercise.currentStateString.currentTime >
                MAX_FAST_FORWARD_DURATION_MS
        ) {
            throw new ExerciseAlreadyStartedError();
        }

        const exercise =
            await this.exerciseManagerService.createExerciseFromTemplate(
                parallelExercise.template.id,
                'parallel',
                undefined,
                { parallelExerciseId: parallelExercise.id },
                parallelExercise.templateStateString
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
    ): Promise<ParallelExerciseDetailsEntryWithUserRole> {
        await this.exerciseService.saveUnsavedExercises();

        const template =
            await this.exerciseManagerService.getExerciseTemplateById(
                data.templateId,
                session
            );
        const userRole =
            await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                template.organisationId,
                session.user.id
            );
        if (!userRole || !['editor', 'admin'].includes(userRole)) {
            throw new PermissionDeniedError();
        }

        return this.parallelExerciseRepository.transaction(async (tx) => {
            const created = await tx.createParallelExercise({
                ...data,
                templateStateString: template.exercise.currentStateString,
                participantKey: await new AccessKeyRepository(tx).generateKey(
                    7
                ),
                organisationId: template.organisation.id,
            });
            if (!created) {
                throw new ApiError();
            }
            const parallelExercise = await tx.getParallelExerciseById(
                created.id
            );
            return { ...parallelExercise!, userRole };
        });
    }

    public async updateParallelExercise(
        id: ParallelExerciseId,
        session: SessionInformation,
        data: Partial<ParallelExerciseInsert>
    ): Promise<ParallelExerciseDetailsEntryWithUserRole> {
        const parallelExercise =
            await this.parallelExerciseRepository.getParallelExerciseById(id);
        if (!parallelExercise) {
            throw new NotFoundError();
        }

        const userRole =
            await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                parallelExercise.organisationId,
                session.user.id
            );
        if (!userRole || !['editor', 'admin'].includes(userRole)) {
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
        return { ...updatedParallelExercise, userRole };
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
        const isEditorOrAdmin =
            await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                parallelExercise.organisationId,
                session.user.id,
                ['editor', 'admin']
            );
        if (!isEditorOrAdmin) {
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
