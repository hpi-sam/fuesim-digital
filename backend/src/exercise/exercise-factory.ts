import type {
    StateExport,
    ExerciseAction,
    ParticipantKey,
    TrainerKey,
    ExerciseKeys,
} from 'fuesim-digital-shared';
import {
    ExerciseState,
    applyAction,
    cloneDeepMutable,
    ReducerError,
    validateExerciseState,
    validateExerciseAction,
    migrateStateExport,
    validateExerciseExport,
    isParticipantKey,
    isTrainerKey,
} from 'fuesim-digital-shared';
import type { InferSelectModel } from 'drizzle-orm';
import { Config } from '../config.js';
import type {
    exerciseTable,
    actionTable,
    exerciseTemplateTable,
} from '../database/schema.js';
import { pushAll } from '../utils/array.js';
import { RestoreError } from '../utils/restore-error.js';
import { ValidationErrorWrapper } from '../utils/validation-error-wrapper.js';
import type { AccessKeyService } from '../database/services/access-key-service.js';
import { ActionWrapper } from './action-wrapper.js';
import { ActiveExercise } from './active-exercise.js';

export class ExerciseFactory {
    public constructor(private readonly accessKeyService: AccessKeyService) {}

    public async createKeys(): Promise<ExerciseKeys> {
        const participantKey = (await this.accessKeyService.generateKey(
            6
        )) as ParticipantKey;
        const trainerKey = (await this.accessKeyService.generateKey(
            8
        )) as TrainerKey;
        return { participantKey, trainerKey };
    }

    public async fromBlank() {
        const exerciseKeys = await this.createKeys();

        if (
            !isParticipantKey(exerciseKeys.participantKey) ||
            !isTrainerKey(exerciseKeys.trainerKey)
        ) {
            throw new Error('Invalid exercise keys provided');
        }
        return new ActiveExercise(
            exerciseKeys.participantKey,
            exerciseKeys.trainerKey
        );
    }

    /**
     * @param file A **valid** import file
     */
    public async fromFile(file: StateExport): Promise<ActiveExercise> {
        const exerciseKeys = await this.createKeys();

        if (
            !isParticipantKey(exerciseKeys.participantKey) ||
            !isTrainerKey(exerciseKeys.trainerKey)
        ) {
            throw new Error('Invalid exercise keys provided');
        }

        const migratedImportObject = migrateStateExport(file);
        const validationErrors = validateExerciseExport(migratedImportObject);
        if (validationErrors.length > 0) {
            throw new ValidationErrorWrapper(validationErrors);
        }

        const newInitialState =
            migratedImportObject.history?.initialState ??
            migratedImportObject.currentState;
        const newCurrentState = migratedImportObject.currentState;

        // Set new participant id
        newInitialState.participantKey = exerciseKeys.participantKey;
        newCurrentState.participantKey = exerciseKeys.participantKey;

        const exercise = new ActiveExercise(
            exerciseKeys.participantKey,
            exerciseKeys.trainerKey,
            [],
            ExerciseState.currentStateVersion,
            newInitialState,
            newCurrentState
        );
        const actions: ActionWrapper[] = (
            migratedImportObject.history?.actionHistory ?? []
        ).map(
            (action) =>
                new ActionWrapper(
                    action,
                    exercise.emitterId, // this is always null
                    exercise
                )
        );
        pushAll(exercise.temporaryActionHistory, actions);

        exercise.setTickCounter(
            actions.filter(
                (action) =>
                    action.getAction().actionString.type === '[Exercise] Tick'
            ).length
        );

        // The actions haven't been saved in the database yet -> keep them
        this.restore(exercise, true);
        return exercise;
    }

    public fromDatabase(
        dbEntry: InferSelectModel<typeof exerciseTable>,
        actions: InferSelectModel<typeof actionTable>[]
    ): ActiveExercise {
        const actionsInWrapper: ActionWrapper[] = [];
        const exercise = new ActiveExercise(
            dbEntry.participantKey,
            dbEntry.trainerKey,
            actionsInWrapper,
            dbEntry.stateVersion,
            dbEntry.initialStateString,
            dbEntry.currentStateString
        );
        exercise.setExerciseId(dbEntry.id);
        pushAll(
            actionsInWrapper,
            actions.map(
                (action) =>
                    new ActionWrapper(
                        action.actionString,
                        action.emitterId,
                        exercise,
                        action.index,
                        action.id
                    )
            )
        );
        exercise.setTickCounter(dbEntry.tickCounter);
        exercise.markAsSaved();
        return exercise;
    }

    public async fromExerciseTemplate(
        exerciseTemplate: InferSelectModel<typeof exerciseTemplateTable>,
        exercise: InferSelectModel<typeof exerciseTable>,
        actions: InferSelectModel<typeof actionTable>[]
    ): Promise<ActiveExercise> {
        const exerciseKeys = await this.createKeys();
        const actionsInWrapper: ActionWrapper[] = [];
        const newExercise = new ActiveExercise(
            exerciseKeys.participantKey,
            exerciseKeys.trainerKey,
            actionsInWrapper,
            exercise.stateVersion,
            {
                ...exercise.initialStateString,
                participantKey: exerciseKeys.participantKey,
            },
            {
                ...exercise.currentStateString,
                participantKey: exerciseKeys.participantKey,
            }
        );
        pushAll(
            actionsInWrapper,
            actions.map(
                (action) =>
                    new ActionWrapper(
                        action.actionString,
                        action.emitterId,
                        newExercise,
                        action.index,
                        action.id
                    )
            )
        );
        newExercise.setTickCounter(exercise.tickCounter);
        return newExercise;
    }

    public restore(activeExercise: ActiveExercise, keepActions: boolean): void {
        const exercise = activeExercise.getExercise();

        // Check State Version
        if (exercise.stateVersion !== ExerciseState.currentStateVersion) {
            throw new RestoreError(
                `The exercise was created with an incompatible version of the state (got version ${exercise.stateVersion}, required version ${ExerciseState.currentStateVersion})`,
                activeExercise.exerciseId
            );
        }

        // Validate initial state
        const errors = validateExerciseState(exercise.initialStateString);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }

        this.restoreState(activeExercise, keepActions);
    }

    /**
     * @param keepActions This indicates whether to keep the actions that were applied while restoring in the array (when `true`) or to remove them (when `false` and when the database gets used)
     * Recreates the {@link currentState} by applying all actions from {@link temporaryActionHistory} to the {@link initialState}
     * as well as adding actions to the end to gracefully mark the end of the previous exercise session.
     */
    private restoreState(activeExercise: ActiveExercise, keepActions: boolean) {
        const exercise = activeExercise.getExercise();
        let currentState = cloneDeepMutable(exercise.initialStateString);

        activeExercise.temporaryActionHistory.forEach((actionWrapper) => {
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
                        activeExercise.exerciseId,
                        e
                    );
                }
                throw e;
            }
        });
        exercise.currentStateString = currentState;
        activeExercise.incrementIdGenerator.setCurrent(
            activeExercise.temporaryActionHistory.length
        );
        if (Config.useDb && !keepActions) {
            // Remove all actions to not save them again in the database
            activeExercise.temporaryActionHistory.splice(
                0,
                activeExercise.temporaryActionHistory.length
            );
        }
        // Pause exercise
        if (exercise.currentStateString.currentStatus === 'running')
            activeExercise.reduce(
                {
                    type: '[Exercise] Pause',
                },
                // Exercise emitter Id is always null
                null
            );
        // Remove all clients from state
        Object.values(exercise.currentStateString.clients).forEach((client) => {
            const removeClientAction: ExerciseAction = {
                type: '[Client] Remove client',
                clientId: client.id,
            };
            activeExercise.reduce(
                removeClientAction,
                // Exercise emitter Id is always null
                null
            );
        });
    }

    private validateAction(action: ExerciseAction) {
        const errors = validateExerciseAction(action);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }
    }
}
