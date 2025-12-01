import type {
    ExerciseAction,
    ExerciseIds,
    ExerciseTimeline,
    Mutable,
    Role,
    StateExport,
    UUID,
} from 'digital-fuesim-manv-shared';
import {
    applyAction,
    cloneDeepMutable,
    ExerciseState,
    reduceExerciseState,
    ReducerError,
    validateExerciseAction,
    validateExerciseState,
} from 'digital-fuesim-manv-shared';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { asc, eq, lt } from 'drizzle-orm';
import {
    actionWrapperTable,
    exerciseWrapperTable,
} from '../database/schema.js';
import type {
    DatabaseTransaction,
    DatabaseService,
} from '../database/services/database-service.js';
import { Config } from '../config.js';
import { migrateInDatabase } from '../database/migrate-in-database.js';
import { NormalType } from '../database/normal-type.js';
import { pushAll, removeAll } from '../utils/array.js';
import { IncrementIdGenerator } from '../utils/increment-id-generator.js';
import { RestoreError } from '../utils/restore-error.js';
import { UserReadableIdGenerator } from '../utils/user-readable-id-generator.js';
import { ValidationErrorWrapper } from '../utils/validation-error-wrapper.js';
import { ActionWrapper } from './action-wrapper.js';
import type { ClientWrapper } from './client-wrapper.js';
import { exerciseMap } from './exercise-map.js';
import { patientTick } from './patient-ticking.js';
import { PeriodicEventHandler } from './periodic-events/periodic-event-handler.js';

export class ExerciseWrapper extends NormalType<typeof exerciseWrapperTable> {
    private _changedSinceSave = true;

    public get changedSinceSave() {
        return this._changedSinceSave;
    }

    private numberOfActionsToBeSaved = 0;

    /**
     * Mark this exercise as being up-to-date in the database
     */
    public markAsSaved() {
        this.temporaryActionHistory.splice(0, this.numberOfActionsToBeSaved);
        this._changedSinceSave = this.temporaryActionHistory.length > 0;
        this.numberOfActionsToBeSaved = 0;
    }

    public markAsAboutToBeSaved() {
        this.numberOfActionsToBeSaved = this.temporaryActionHistory.length;
    }

    /**
     * Mark this exercise as being out-of-date with the database representation
     */
    public markAsModified() {
        this._changedSinceSave = true;
    }

    private async saveActions(database?: DatabaseTransaction | null) {
        const entities = await Promise.all(
            this.temporaryActionHistory.slice(0, this.numberOfActionsToBeSaved).map(async (action) =>
                action.save(database)
            )
        );
        return entities;
    }

    public async save(database?: DatabaseTransaction | null) {
        const patch: InferInsertModel<typeof exerciseWrapperTable> = {
            initialStateString: this.entity.initialStateString,
            currentStateString: this.entity.currentStateString,
            participantId: this.entity.participantId,
            trainerId: this.entity.trainerId,
            stateVersion: this.entity.stateVersion,
            tickCounter: this.entity.tickCounter,
        };

        if (this.entity.id !== undefined) {
            patch.id = this.entity.id;
        }

        const insert = await (database ?? this.databaseService)
            .insert(exerciseWrapperTable)
            .values(patch)
            .onConflictDoUpdate({
                target: exerciseWrapperTable.id,
                set: patch,
            })
            .returning();

        if (insert.length > 0 && insert[0]?.id !== undefined) {
            this.entity.id = insert[0].id;
        }

        await this.saveActions(database);
        this.markAsSaved();
    }

    private static createFromDatabase(
        dbEntry: InferSelectModel<typeof exerciseWrapperTable> & {
            actions?: InferSelectModel<typeof actionWrapperTable>[];
        },
        databaseService: DatabaseService
    ): ExerciseWrapper {
        const actionsInWrapper: ActionWrapper[] = [];
        const normal = new ExerciseWrapper(
            dbEntry.participantId,
            dbEntry.trainerId,
            actionsInWrapper,
            databaseService,
            dbEntry.stateVersion,
            dbEntry.initialStateString,
            dbEntry.currentStateString
        );
        normal.entity = dbEntry;
        if (dbEntry.actions) {
            pushAll(
                actionsInWrapper,
                dbEntry.actions.map((action) =>
                    ActionWrapper.createFromDatabase(
                        action,
                        databaseService,
                        normal
                    )
                )
            );
        }
        normal.tickCounter = dbEntry.tickCounter;
        normal.markAsSaved();
        return normal;
    }

    private tickCounter = 0;

    /**
     * The server always uses `null` as their emitter id.
     */
    private readonly emitterId = null;

    /**
     * How many ticks have to pass until treatments get recalculated (e.g. with {@link tickInterval} === 1000 and {@link refreshTreatmentInterval} === 60 every minute)
     */
    private readonly refreshTreatmentInterval = 20;
    /**
     * This function gets called once every second in case the exercise is running.
     * All periodic actions of the exercise (e.g. status changes for patients) should happen here.
     */
    private readonly tick = async () => {
        try {
            const patientUpdates = patientTick(
                this.getStateSnapshot(),
                this.tickInterval
            );
            const updateAction: ExerciseAction = {
                type: '[Exercise] Tick',
                patientUpdates,
                /**
                 * Refresh every {@link refreshTreatmentInterval} * {@link tickInterval} ms seconds
                 */
                // TODO: Refactor this: do this in the reducer instead of sending it in the action
                refreshTreatments:
                    this.tickCounter % this.refreshTreatmentInterval === 0,
                tickInterval: this.tickInterval,
            };
            this.applyAction(updateAction, this.emitterId);
            this.tickCounter++;
            this.markAsModified();
        } catch (e: unknown) {
            // Something went wrong in tick, probably some corrupted simulation state.
            console.error(e);
            try {
                this.applyAction(
                    {
                        type: '[Exercise] Pause',
                    },
                    this.emitterId
                );
                this.markAsModified();
            } catch {
                // Alright, this is enough. Something is fundamentally broken.
                this.pause();
            }
        }
    };

    // Call the tick every 1000 ms
    private readonly tickInterval = 1000;
    private readonly tickHandler = new PeriodicEventHandler(
        this.tick,
        this.tickInterval
    );

    private readonly clients = new Set<ClientWrapper>();

    public readonly incrementIdGenerator = new IncrementIdGenerator();

    /**
     * Be very careful when using this. - Use {@link create} instead for most use cases.
     * This constructor does not guarantee a valid entity.
     */
    private constructor(
        participantId: string,
        trainerId: string,
        public readonly temporaryActionHistory: ActionWrapper[],
        databaseService: DatabaseService,
        stateVersion: number,
        initialState = ExerciseState.create(participantId),
        currentState: ExerciseState = initialState
    ) {
        super(databaseService);

        this.entity = {
            currentStateString: currentState,
            initialStateString: initialState,
            participantId,
            trainerId,
            stateVersion,
            tickCounter: 0,
        };
    }

    /**
     * @param file A **valid** import file
     */
    public static async importFromFile(
        databaseService: DatabaseService,
        file: StateExport,
        exerciseIds: ExerciseIds
    ): Promise<ExerciseWrapper> {
        const newInitialState = file.history?.initialState ?? file.currentState;
        const newCurrentState = file.currentState;
        // Set new participant id
        newInitialState.participantId = exerciseIds.participantId;
        newCurrentState.participantId = exerciseIds.participantId;
        const exercise = new ExerciseWrapper(
            exerciseIds.participantId,
            exerciseIds.trainerId,
            [],
            databaseService,
            ExerciseState.currentStateVersion,
            newInitialState,
            newCurrentState
        );
        const actions = (file.history?.actionHistory ?? []).map(
            (action) =>
                new ActionWrapper(
                    databaseService,
                    action,
                    exercise.emitterId,
                    exercise
                )
        );
        pushAll(exercise.temporaryActionHistory, actions);
        // The actions haven't been saved in the database yet -> keep them
        exercise.restore(true);
        exercise.tickCounter = actions.filter(
            (action) => action.entity.actionString.type === '[Exercise] Tick'
        ).length;

        await databaseService.insert(exerciseWrapperTable).values({
            initialStateString: exercise.entity.initialStateString,
            participantId: exercise.entity.participantId,
            trainerId: exercise.entity.trainerId,
            currentStateString: exercise.entity.currentStateString,
            stateVersion: exercise.entity.stateVersion,
            tickCounter: exercise.entity.tickCounter,
        });
        return exercise;
    }

    public static create(
        participantId: string,
        trainerId: string,
        databaseService: DatabaseService,
        initialState: ExerciseState = ExerciseState.create(participantId)
    ): ExerciseWrapper {
        const exercise = new ExerciseWrapper(
            participantId,
            trainerId,
            [],
            databaseService,
            ExerciseState.currentStateVersion,
            initialState
        );

        return exercise;
    }

    private restore(keepActions: boolean): void {
        if (this.entity.stateVersion !== ExerciseState.currentStateVersion) {
            throw new RestoreError(
                `The exercise was created with an incompatible version of the state (got version ${this.entity.stateVersion}, required version ${ExerciseState.currentStateVersion})`,
                this.entity.id!
            );
        }
        this.validateInitialState();
        this.restoreState(keepActions);
    }

    /**
     * @param keepActions This indicates whether to keep the actions that were applied while restoring in the array (when `true`) or to remove them (when `false` and when the database gets used)
     * Recreates the {@link currentState} by applying all actions from {@link temporaryActionHistory} to the {@link initialState}
     * as well as adding actions to the end to gracefully mark the end of the previous exercise session.

     */
    private restoreState(keepActions: boolean) {
        let currentState = cloneDeepMutable(this.entity.initialStateString);
        this.temporaryActionHistory.forEach((actionWrapper) => {
            this.validateAction(actionWrapper.entity.actionString);
            try {
                currentState = applyAction(
                    currentState,
                    actionWrapper.entity.actionString
                );
            } catch (e: unknown) {
                if (e instanceof ReducerError) {
                    throw new RestoreError(
                        `A reducer error occurred while restoring (Action ${actionWrapper.entity.index
                        }: \`${JSON.stringify(actionWrapper.entity.actionString)}\`)`,
                        this.entity.id ?? 'unknown id',
                        e
                    );
                }
                throw e;
            }
        });
        this.entity.currentStateString = currentState;
        this.incrementIdGenerator.setCurrent(
            this.temporaryActionHistory.length
        );
        if (Config.useDb && !keepActions) {
            // Remove all actions to not save them again in the database
            this.temporaryActionHistory.splice(
                0,
                this.temporaryActionHistory.length
            );
        }
        // Pause exercise
        if (this.entity.currentStateString.currentStatus === 'running')
            this.reduce(
                {
                    type: '[Exercise] Pause',
                },
                this.emitterId
            );
        // Remove all clients from state
        Object.values(this.entity.currentStateString.clients).forEach(
            (client) => {
                const removeClientAction: ExerciseAction = {
                    type: '[Client] Remove client',
                    clientId: client.id,
                };
                this.reduce(removeClientAction, this.emitterId);
            }
        );
    }

    public static async restoreAllExercises(
        databaseService: DatabaseService
    ): Promise<ExerciseWrapper[]> {
        return databaseService.transaction(async (dbtx) => {
            const outdatedExercises = await dbtx
                .select()
                .from(exerciseWrapperTable)
                .where(
                    lt(
                        exerciseWrapperTable.stateVersion,
                        ExerciseState.currentStateVersion
                    )
                );
            await Promise.all(
                outdatedExercises.map(async (exercise) => {
                    await migrateInDatabase(exercise.id, dbtx);
                })
            );

            const exercises = await Promise.all(
                Object.values(
                    (
                        await dbtx
                            .select()
                            .from(exerciseWrapperTable)
                            .leftJoin(
                                actionWrapperTable,
                                eq(
                                    exerciseWrapperTable.id,
                                    actionWrapperTable.exerciseId
                                )
                            )
                    ).reduce<{
                        [key: string]: {
                            exercise: InferSelectModel<
                                typeof exerciseWrapperTable
                            >;
                            actions: InferSelectModel<
                                typeof actionWrapperTable
                            >[];
                        };
                    }>((acc, row) => {
                        const exercise = row.exercise_wrapper_entity;
                        const action = row.action_wrapper_entity;

                        acc[exercise.id] ??= { exercise, actions: [] };

                        if (action) {
                            acc[exercise.id]!.actions.push(action);
                        }
                        return acc;
                    }, {})
                ).map(async (exerciseEntity) => {
                    const exercise = ExerciseWrapper.createFromDatabase(
                        exerciseEntity.exercise,
                        databaseService
                    );
                    removeAll(exercise.temporaryActionHistory);

                    // Load all actions
                    pushAll(
                        exercise.temporaryActionHistory,
                        (
                            await dbtx
                                .select()
                                .from(actionWrapperTable)
                                .where(
                                    eq(
                                        actionWrapperTable.exerciseId,
                                        exercise.entity.id!
                                    )
                                )
                                .orderBy(asc(actionWrapperTable.index))
                        ).map((actionEntity) =>
                            ActionWrapper.createFromDatabase(
                                actionEntity,
                                databaseService,
                                exercise
                            )
                        )
                    );
                    return exercise;
                })
            );
            await Promise.all(
                // The actions have already been saved in the database -> do not keep them
                exercises.map(async (exercise) => exercise.restore(false))
            );
            exercises.forEach((exercise) => {
                exerciseMap.set(exercise.entity.participantId, exercise);
                exerciseMap.set(exercise.entity.trainerId, exercise);
            });
            UserReadableIdGenerator.lock([...exerciseMap.keys()]);
            return exercises;
        });
    }

    /**
     * Select the role that is applied when using the given id.
     * @param id The id the client used.
     * @returns The role of the client, determined by the id.
     * @throws {@link RangeError} in case the provided {@link id} is not part of this exercise.
     */
    public getRoleFromUsedId(id: string): Role {
        switch (id) {
            case this.entity.participantId:
                return 'participant';
            case this.entity.trainerId:
                return 'trainer';
            default:
                throw new RangeError(
                    `Incorrect id: ${id} where pid=${this.entity.participantId} and tid=${this.entity.trainerId}`
                );
        }
    }

    public getStateSnapshot(): ExerciseState {
        return this.entity.currentStateString;
    }

    // TODO: To more generic function
    private emitAction(action: ExerciseAction) {
        this.clients.forEach((client) => client.emitAction(action));
    }

    public addClient(clientWrapper: ClientWrapper) {
        if (clientWrapper.client === undefined) {
            return;
        }
        const client = clientWrapper.client;
        const addClientAction: ExerciseAction = {
            type: '[Client] Add client',
            client,
        };
        this.applyAction(addClientAction, client.id);
        // Only after all this add the client in order to not send the action adding itself to it
        this.clients.add(clientWrapper);
    }

    public removeClient(clientWrapper: ClientWrapper) {
        if (!this.clients.has(clientWrapper)) {
            // clientWrapper not part of this exercise
            return;
        }
        const client = clientWrapper.client!;
        const removeClientAction: ExerciseAction = {
            type: '[Client] Remove client',
            clientId: client.id,
        };
        this.applyAction(removeClientAction, client.id, () => {
            clientWrapper.disconnect();
            this.clients.delete(clientWrapper);
        });
        if (
            this.clients.size === 0 &&
            this.entity.currentStateString.currentStatus === 'running'
        ) {
            // Pause the exercise
            this.applyAction(
                {
                    type: '[Exercise] Pause',
                },
                null
            );
        }
    }

    public start() {
        this.tickHandler.start();
    }

    public pause() {
        this.tickHandler.pause();
    }

    /**
     * Applies and broadcasts the action on the current state.
     * @param intermediateAction When set is run between reducing the state and broadcasting the action
     * @throws Error if the action is not applicable on the current state
     */
    public applyAction(
        action: ExerciseAction,
        emitterId: UUID | null,
        intermediateAction?: () => void
    ): void {
        this.reduce(action, emitterId);
        intermediateAction?.();
        this.emitAction(action);
    }

    /**
     * Applies the action on the current state.
     * @throws Error if the action is not applicable on the current state
     */
    private reduce(action: ExerciseAction, emitterId: UUID | null): void {
        const newState = reduceExerciseState(
            this.entity.currentStateString,
            action
        );
        this.setState(newState, action, emitterId);
        if (action.type === '[Exercise] Pause') {
            this.pause();
        } else if (action.type === '[Exercise] Start') {
            this.start();
        }
    }

    private validateInitialState() {
        const errors = validateExerciseState(this.entity.initialStateString);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }
    }

    private validateAction(action: ExerciseAction) {
        const errors = validateExerciseAction(action);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }
    }

    private setState(
        newExerciseState: ExerciseState,
        action: ExerciseAction,
        emitterId: UUID | null
    ): void {
        // TODO: @Quixelation --> maybe not do this sync, but keep the old patterns of having a js object and updating the database every 10s

        this.entity.currentStateString = newExerciseState;
        this.temporaryActionHistory.push(
            new ActionWrapper(this.databaseService, action, emitterId, this)
        );
        this.markAsModified();
    }

    public async deleteExercise() {
        this.clients.forEach((client) => client.disconnect());
        // Pause the exercise to stop the tick
        this.pause();
        exerciseMap.delete(this.entity.participantId);
        exerciseMap.delete(this.entity.trainerId);
        if (this.entity.id !== undefined) {
            await this.databaseService
                .delete(exerciseWrapperTable)
                .where(eq(exerciseWrapperTable.id, this.entity.id));
            this.markAsSaved();
        }
    }

    public async getTimeLine(): Promise<ExerciseTimeline> {
        const completeHistory = [
            ...(this.entity.id !== undefined && Config.useDb
                ? await this.databaseService
                    .select()
                    .from(actionWrapperTable)
                    .where(eq(actionWrapperTable.exerciseId, this.entity.id))
                : []
            ).map((action) =>
                ActionWrapper.createFromDatabase(
                    action,
                    this.databaseService,
                    this
                )
            ),
            ...this.temporaryActionHistory,
        ]
            // TODO: Is this necessary?
            .sort((a, b) => a.entity.index - b.entity.index);
        return {
            initialState: this.entity.initialStateString,
            actionsWrappers: completeHistory.map((action) => ({
                action: action.entity.actionString,
                emitterId: action.entity.emitterId ?? null,
                time: action.entity.index,
            })),
        };
    }
}
