import type {
    ExerciseAction,
    Role,
    UUID,
    ExerciseKey,
    ParticipantKey,
    TrainerKey,
} from 'fuesim-digital-shared';
import {
    ExerciseState,
    validateExerciseState,
    applyAction,
    cloneDeepMutable,
    reduceExerciseState,
    ReducerError,
    validateExerciseAction,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import type {
    ExerciseEntry,
    ExerciseTemplateEntry,
} from '../database/schema.js';
import { IncrementIdGenerator } from '../utils/increment-id-generator.js';
import { ValidationErrorWrapper } from '../utils/validation-error-wrapper.js';
import { RestoreError } from '../utils/restore-error.js';
import { ActionWrapper } from './action-wrapper.js';
import type { ExerciseClientWrapper } from './client-wrapper.js';
import { patientTick } from './patient-ticking.js';
import { PeriodicEventHandler } from './periodic-events/periodic-event-handler.js';

export class ActiveExercise {
    public readonly actionApplied = new Subject<boolean>();
    public template: ExerciseTemplateEntry | null = null;

    public get exercise() {
        return this._exercise;
    }

    public get participantKey(): ParticipantKey {
        // This should always be valid, since we are creating all active exercises in the exercise factory which ensures valid keys
        return this.exercise.participantKey;
    }

    public get trainerKey(): TrainerKey {
        // This should always be valid, since we are creating all active exercises in the exercise factory which ensures valid keys
        return this.exercise.trainerKey;
    }

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

    public getSavableActions() {
        return this.temporaryActionHistory.slice(
            0,
            this.numberOfActionsToBeSaved
        );
    }

    /**
     * The server always uses `null` as their emitter id.
     */
    public readonly emitterId = null;

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
                    this.exercise.tickCounter %
                        this.refreshTreatmentInterval ===
                    0,
                tickInterval: this.tickInterval,
            };
            this.applyAction(updateAction, this.emitterId);
            this.exercise.tickCounter++;
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

    public readonly clients = new Set<ExerciseClientWrapper>();

    public readonly incrementIdGenerator = new IncrementIdGenerator();

    public constructor(
        private readonly _exercise: ExerciseEntry,
        public readonly temporaryActionHistory: ActionWrapper[] = []
    ) {}

    /**
     * Select the role that is applied when using the given id.
     * @param id The id the client used.
     * @returns The role of the client, determined by the id.
     * @throws {@link RangeError} in case the provided {@link id} is not part of this exercise.
     */
    public getRoleFromUsedKey(id: ExerciseKey): Role {
        switch (id) {
            case this.exercise.participantKey:
                return 'participant';
            case this.exercise.trainerKey:
                return 'trainer';
            default:
                throw new RangeError(
                    `Incorrect id: ${id} where pid=${this.exercise.participantKey} and tid=${this.exercise.trainerKey}`
                );
        }
    }

    public getStateSnapshot(): ExerciseState {
        return this.exercise.currentStateString;
    }

    // TODO: To more generic function
    private emitAction(action: ExerciseAction) {
        this.clients.forEach((client) => client.emitAction(action));
    }

    public addClient(clientWrapper: ExerciseClientWrapper) {
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

    public removeClient(clientWrapper: ExerciseClientWrapper) {
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
            this.clients.delete(clientWrapper);
        });
        if (
            this.clients.size === 0 &&
            this.exercise.currentStateString.currentStatus === 'running'
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
        this.actionApplied.next(true);
    }

    /**
     * Applies the action on the current state.
     * @throws Error if the action is not applicable on the current state
     */
    public reduce(action: ExerciseAction, emitterId: UUID | null): void {
        const newState = reduceExerciseState(
            this.exercise.currentStateString,
            action
        );
        this.setState(newState, action, emitterId);
        if (action.type === '[Exercise] Pause') {
            this.pause();
        } else if (action.type === '[Exercise] Start') {
            this.start();
        }
    }

    private setState(
        newExerciseState: ExerciseState,
        action: ExerciseAction,
        emitterId: UUID | null
    ): void {
        this.exercise.currentStateString = newExerciseState;
        this.temporaryActionHistory.push(
            new ActionWrapper(action, emitterId, this)
        );
        this.markAsModified();
    }

    public unload() {
        this.clients.forEach((clientWrapper) => clientWrapper.disconnect());
        // Pause the exercise to stop the tick
        this.pause();
    }

    private validateAction(action: ExerciseAction) {
        const errors = validateExerciseAction(action);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }
    }

    public restore(keepActions: boolean): void {
        // Check State Version
        if (this.exercise.stateVersion !== ExerciseState.currentStateVersion) {
            throw new RestoreError(
                `The exercise was created with an incompatible version of the state (got version ${this.exercise.stateVersion}, required version ${ExerciseState.currentStateVersion})`,
                this.exercise.id
            );
        }

        // Validate initial state
        const errors = validateExerciseState(this.exercise.initialStateString);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }

        this.restoreState(keepActions);
    }

    /**
     * @param keepActions This indicates whether to keep the actions that were applied while restoring in the array (when `true`) or to remove them (when `false` and when the database gets used)
     * Recreates the {@link currentState} by applying all actions from {@link temporaryActionHistory} to the {@link initialState}
     * as well as adding actions to the end to gracefully mark the end of the previous exercise session.
     */
    private restoreState(keepActions: boolean) {
        // TODO: switch to use cloneDeep() and then produce()
        let currentState = cloneDeepMutable(this.exercise.initialStateString);

        this.temporaryActionHistory.forEach((actionWrapper) => {
            this.validateAction(actionWrapper.getAction().actionString);
            try {
                currentState = applyAction(
                    currentState,
                    actionWrapper.getAction().actionString
                );
            } catch (e: unknown) {
                if (e instanceof ReducerError) {
                    throw new RestoreError(
                        `A reducer error occurred while restoring (Action ${
                            actionWrapper.getAction().index
                        }: \`${JSON.stringify(actionWrapper.getAction().actionString)}\`)`,
                        this.exercise.id,
                        e
                    );
                }
                throw e;
            }
        });
        this.exercise.currentStateString = currentState;
        this.incrementIdGenerator.setCurrent(
            this.temporaryActionHistory.length
        );
        if (!keepActions) {
            // Remove all actions to not save them again in the database
            this.temporaryActionHistory.splice(
                0,
                this.temporaryActionHistory.length
            );
        }
        // Pause exercise
        if (this.exercise.currentStateString.currentStatus === 'running')
            this.reduce(
                {
                    type: '[Exercise] Pause',
                },
                // Exercise emitter Id is always null
                null
            );
        // Remove all clients from state
        Object.values(this.exercise.currentStateString.clients).forEach(
            (client) => {
                const removeClientAction: ExerciseAction = {
                    type: '[Client] Remove client',
                    clientId: client.id,
                };
                this.reduce(
                    removeClientAction,
                    // Exercise emitterId is always null
                    null
                );
            }
        );
    }
}
