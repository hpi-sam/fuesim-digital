import type {
    ParallelExerciseId,
    ParallelTracesOverview,
    ParticipantKey,
    ProcessEvent,
    SetAutojoinViewportAction,
    ParallelExerciseKey,
} from 'fuesim-digital-shared';
import {
    actionProcessorDictionary,
    applyAction,
    cloneDeepMutable,
    miningServiceResponseSchema,
    parallelExerciseInstanceSummarySchema,
} from 'fuesim-digital-shared';
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
import type { ActionRepository } from '../repositories/action-repository.js';
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
        private readonly exerciseService: ExerciseService,
        private readonly actionRepository: ActionRepository
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

    public async preProcessTraces(parallelExerciseId: ParallelExerciseId) {
        const parallelExerciseInstances =
            await this.parallelExerciseRepository.getParallelExerciseInstancesById(
                parallelExerciseId
            );

        const processEvents: { [Key in ParticipantKey]: ProcessEvent[] } = {};

        for (const parallelExerciseInstance of parallelExerciseInstances) {
            // eslint-disable-next-line no-await-in-loop
            const actions = await this.actionRepository.getActionsForExerciseId(
                parallelExerciseInstance.id
            );
            const currentState = cloneDeepMutable(
                parallelExerciseInstance.initialStateString
            );
            console.log(`INSTANCE ${parallelExerciseInstance.id}`);

            let exerciseRunning = false;
            let onlyStartAndStop = true;
            let previousEvent: ProcessEvent | null = null;
            let previousEventName: string | null = null;
            const occurrenceMap: { [Key in string]: number } = {};
            processEvents[parallelExerciseInstance.participantKey] = [];

            for (const [i, actionEntry] of actions.entries()) {
                const action = actionEntry.actionString;
                applyAction(currentState, action);

                if (action.type === '[Exercise] Start') {
                    exerciseRunning = true;
                }

                // Only use actions during exercise run
                if (!exerciseRunning) continue;

                const actionProcessor = actionProcessorDictionary[action.type];

                if (actionProcessor !== undefined) {
                    // @ts-expect-error too complex
                    const processEvent = actionProcessor.processFull(
                        currentState,
                        action,
                        i
                    );
                    if (
                        actionProcessor.mergeSubsequent &&
                        previousEvent &&
                        previousEventName === processEvent.name
                    ) {
                        console.log('MERGE HERE', previousEvent.name);
                        previousEvent.endTime = currentState.currentTime;
                        continue;
                    }

                    previousEventName = processEvent.name;
                    previousEvent = processEvent;

                    const occurrence =
                        (occurrenceMap[processEvent.name] ?? 0) + 1;
                    occurrenceMap[processEvent.name] = occurrence;
                    processEvent.name = `${occurrence}. ${processEvent.name}`;
                    processEvent.verboseName = `${occurrence}. ${processEvent.verboseName}`;

                    // console.log(
                    //     `[EVENT] ${processEvent.timestamp} ${processEvent.name} ${processEvent.verboseName}`
                    // );
                    processEvents[
                        parallelExerciseInstance.participantKey
                    ]!.push(processEvent);

                    if (
                        !['[Exercise] Start', '[Exercise] Pause'].includes(
                            action.type
                        )
                    ) {
                        onlyStartAndStop = false;
                    }
                }
                if (action.type === '[Exercise] Pause') {
                    exerciseRunning = false;
                }
            }

            // If the participant didn't do anything, empty it
            if (onlyStartAndStop) {
                console.log('only start and stop');
                processEvents[parallelExerciseInstance.participantKey] = [];
            }
        }
        return processEvents;
    }
    public async getParallelTracesOverviewById(
        parallelExerciseId: ParallelExerciseId
    ): Promise<ParallelTracesOverview> {
        const processEvents = await this.preProcessTraces(parallelExerciseId);
        const result = await fetch('http://localhost:4202/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.values(processEvents).flat()),
        });
        const data = miningServiceResponseSchema.parse(await result.json());

        return {
            events: processEvents,
            dfg: data.dfg,
            clusters: data.clusters,
        };
    }
}
