import type {
    ExerciseAction,
    Role,
    UUID,
    ExerciseKey,
    ParticipantKey,
    TrainerKey,
    ExerciseId,
} from 'fuesim-digital-shared';
import { ExerciseState, reduceExerciseState } from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import type {
    ExerciseTemplateEntry,
    ExerciseInsert,
} from '../database/schema.js';
import { IncrementIdGenerator } from '../utils/increment-id-generator.js';
import { ActionWrapper } from './action-wrapper.js';
import type { ExerciseClientWrapper } from './client-wrapper.js';
import { patientTick } from './patient-ticking.js';
import { PeriodicEventHandler } from './periodic-events/periodic-event-handler.js';

export class ActiveExercise {
    private readonly exercise: Omit<ExerciseInsert, 'id'>;

    public readonly actionApplied = new Subject<boolean>();

    // We need to make sure this is set by
    // the ExerciseService when creating/loading
    // the exercise or the ExerciseFactory when
    // restoring an exercise
    private _exerciseId!: ExerciseId;

    public get exerciseId(): ExerciseId {
        return this._exerciseId;
    }

    public setExerciseId(value: ExerciseId) {
        // the strictness is only valid, if the id is immediately set
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._exerciseId !== undefined) {
            throw new Error('Exercise ID has already been set.');
        }
        this._exerciseId = value;
    }

    public template: ExerciseTemplateEntry | null = null;

    public getExercise() {
        return this.exercise;
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

    public getSaveableActions() {
        return this.temporaryActionHistory.slice(
            0,
            this.numberOfActionsToBeSaved
        );
    }

    private tickCounter = 0;
    public setTickCounter(val: number) {
        this.tickCounter = val;
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

    private readonly clients = new Set<ExerciseClientWrapper>();

    public readonly incrementIdGenerator = new IncrementIdGenerator();

    public constructor(
        participantKey: ParticipantKey,
        trainerKey: TrainerKey,
        public readonly temporaryActionHistory: ActionWrapper[] = [],
        stateVersion: number = ExerciseState.currentStateVersion,
        initialState = ExerciseState.create(participantKey),
        currentState: ExerciseState = initialState
    ) {
        this.exercise = {
            currentStateString: currentState,
            initialStateString: initialState,
            participantKey,
            trainerKey,
            stateVersion,
            tickCounter: 0,
        };
    }

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
        this.clients.forEach((client) => client.disconnect());
        // Pause the exercise to stop the tick
        this.pause();
    }
}
