import type {
    actionWrapperTable,
    exerciseWrapperTable,
} from 'database/schema.js';
import type {
    StateExport,
    ExerciseIds,
    ExerciseAction,
} from 'digital-fuesim-manv-shared';
import {
    ExerciseState,
    applyAction,
    cloneDeepMutable,
    ReducerError,
    validateExerciseState,
    validateExerciseAction,
    migrateStateExport,
    validateExerciseExport,
} from 'digital-fuesim-manv-shared';
import { pushAll } from 'utils/array.js';
import { Config } from 'config.js';
import type { InferSelectModel } from 'drizzle-orm';
import { RestoreError } from 'utils/restore-error.js';
import { ValidationErrorWrapper } from 'utils/validation-error-wrapper.js';
import { ExerciseWrapper } from './exercise-wrapper.js';
import { ActionWrapper } from './action-wrapper.js';
import type { HttpResponse } from './http-handler/utils.js';

export class ExerciseFactory {
    public static fromBlank(exerciseIds: ExerciseIds) {
        return ExerciseWrapper.create(
            exerciseIds.participantId,
            exerciseIds.trainerId,
            ExerciseState.create(exerciseIds.participantId)
        );
    }

    /**
     * @param file A **valid** import file
     */
    public static fromFile(
        file: StateExport,
        exerciseIds: ExerciseIds
    ): ExerciseWrapper | HttpResponse<ExerciseIds> {
        const migratedImportObject = migrateStateExport(file);
        const validationErrors = validateExerciseExport(migratedImportObject);
        if (validationErrors.length > 0) {
            throw new ValidationErrorWrapper(validationErrors);
        }

        try {
            const newInitialState =
                file.history?.initialState ?? file.currentState;
            const newCurrentState = file.currentState;

            // Set new participant id
            newInitialState.participantId = exerciseIds.participantId;
            newCurrentState.participantId = exerciseIds.participantId;

            const exercise = new ExerciseWrapper(
                exerciseIds.participantId,
                exerciseIds.trainerId,
                [],
                ExerciseState.currentStateVersion,
                newInitialState,
                newCurrentState
            );
            const actions: ActionWrapper[] = (
                file.history?.actionHistory ?? []
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
                        action.getAction().actionString.type ===
                        '[Exercise] Tick'
                ).length
            );

            // The actions haven't been saved in the database yet -> keep them
            this.restore(exercise, true);
            return exercise;
        } catch (e: unknown) {
            if (e instanceof ReducerError) {
                return {
                    statusCode: 400,
                    body: {
                        message: `Error importing exercise: ${e.message}`,
                    },
                };
            }
            throw e;
        }
    }

    public static fromDatabase(
        dbEntry: InferSelectModel<typeof exerciseWrapperTable> & {
            actions?: InferSelectModel<typeof actionWrapperTable>[];
        },
        exerciseIds?: ExerciseIds
    ): ExerciseWrapper {
        const actionsInWrapper: ActionWrapper[] = [];
        const exercise = new ExerciseWrapper(
            exerciseIds?.participantId ?? dbEntry.participantId,
            exerciseIds?.trainerId ?? dbEntry.trainerId,
            actionsInWrapper,
            dbEntry.stateVersion,
            dbEntry.initialStateString,
            dbEntry.currentStateString
        );
        if (dbEntry.actions) {
            pushAll(
                actionsInWrapper,
                dbEntry.actions.map(
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
        }
        exercise.setTickCounter(dbEntry.tickCounter);
        exercise.markAsSaved();
        return exercise;
    }

    public static restore(
        exerciseWrapper: ExerciseWrapper,
        keepActions: boolean
    ): void {
        const exercise = exerciseWrapper.getExercise();

        // Check State Version
        if (exercise.stateVersion !== ExerciseState.currentStateVersion) {
            throw new RestoreError(
                `The exercise was created with an incompatible version of the state (got version ${exercise.stateVersion}, required version ${ExerciseState.currentStateVersion})`,
                exercise.id!
            );
        }

        // Validate initial state
        const errors = validateExerciseState(exercise.initialStateString);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }

        this.restoreState(exerciseWrapper, keepActions);
    }

    /**
     * @param keepActions This indicates whether to keep the actions that were applied while restoring in the array (when `true`) or to remove them (when `false` and when the database gets used)
     * Recreates the {@link currentState} by applying all actions from {@link temporaryActionHistory} to the {@link initialState}
     * as well as adding actions to the end to gracefully mark the end of the previous exercise session.
     */
    private static restoreState(
        exerciseWrapper: ExerciseWrapper,
        keepActions: boolean
    ) {
        const exercise = exerciseWrapper.getExercise();
        let currentState = cloneDeepMutable(exercise.initialStateString);

        exerciseWrapper.temporaryActionHistory.forEach((actionWrapper) => {
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
                        exercise.id ?? 'unknown id',
                        e
                    );
                }
                throw e;
            }
        });
        exercise.currentStateString = currentState;
        exerciseWrapper.incrementIdGenerator.setCurrent(
            exerciseWrapper.temporaryActionHistory.length
        );
        if (Config.useDb && !keepActions) {
            // Remove all actions to not save them again in the database
            exerciseWrapper.temporaryActionHistory.splice(
                0,
                exerciseWrapper.temporaryActionHistory.length
            );
        }
        // Pause exercise
        if (exercise.currentStateString.currentStatus === 'running')
            exerciseWrapper.reduce(
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
            exerciseWrapper.reduce(
                removeClientAction,
                // Exercise emitter Id is always null
                null
            );
        });
    }

    private static validateAction(action: ExerciseAction) {
        const errors = validateExerciseAction(action);
        if (errors.length > 0) {
            throw new ValidationErrorWrapper(errors);
        }
    }
}
