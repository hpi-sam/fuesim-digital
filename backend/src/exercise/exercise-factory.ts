import type {
    StateExport,
    ExerciseAction,
    ParticipantKey,
    TrainerKey,
    ExerciseKeys,
    ExerciseType,
} from 'fuesim-digital-shared';
import {
    ExerciseState,
    applyAction,
    ReducerError,
    validateExerciseState,
    validateExerciseAction,
    migrateStateExport,
    validateExerciseExport,
    isParticipantKey,
    isTrainerKey,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { produce } from 'immer';
import { Config } from '../config.js';
import type {
    ExerciseInsert,
    ExerciseEntry,
    ExerciseTemplateEntry,
    ActionEntry,
} from '../database/schema.js';
import { pushAll } from '../utils/array.js';
import { RestoreError } from '../utils/restore-error.js';
import { ValidationErrorWrapper } from '../utils/validation-error-wrapper.js';
import type { AccessKeyService } from '../database/services/access-key-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ActionWrapper } from './action-wrapper.js';
import { ActiveExercise } from './active-exercise.js';

export class ExerciseFactory {
    public constructor(
        private readonly accessKeyService: AccessKeyService,
        private readonly exerciseService: ExerciseService
    ) {}

    public async createKeys(): Promise<ExerciseKeys> {
        const participantKey = (await this.accessKeyService.generateKey(
            6
        )) as ParticipantKey;
        const trainerKey = (await this.accessKeyService.generateKey(
            8
        )) as TrainerKey;
        return { participantKey, trainerKey };
    }

    public async fromBlank(optionalData: Partial<ExerciseInsert> = {}) {
        const exerciseKeys = await this.createKeys();

        const initialState = ExerciseState.create(exerciseKeys.participantKey);
        const exerciseInsert = {
            ...optionalData,
            ...exerciseKeys,
            initialStateString: initialState,
            currentStateString: initialState,
            stateVersion: ExerciseState.currentStateVersion,
        } satisfies ExerciseInsert;
        const exerciseEntry =
            await this.exerciseService.createExercise(exerciseInsert);
        return new ActiveExercise(exerciseEntry);
    }

    /**
     * @param file A **valid** import file
     */
    public async fromFile(
        file: StateExport,
        optionalData: Partial<ExerciseInsert> = {}
    ): Promise<ActiveExercise> {
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

        const exerciseEntry = {
            ...optionalData,
            ...exerciseKeys,
            initialStateString: newInitialState,
            currentStateString: newCurrentState,
            stateVersion: ExerciseState.currentStateVersion,
        } satisfies ExerciseInsert;
        const exercise =
            await this.exerciseService.createExercise(exerciseEntry);
        const activeExercise = new ActiveExercise(exercise);

        const actions: ActionWrapper[] = (
            migratedImportObject.history?.actionHistory ?? []
        ).map(
            (action) =>
                new ActionWrapper(
                    action,
                    activeExercise.emitterId, // this is always null
                    activeExercise
                )
        );
        pushAll(activeExercise.temporaryActionHistory, actions);

        activeExercise.exercise.tickCounter = actions.filter(
            (action) =>
                action.getAction().actionString.type === '[Exercise] Tick'
        ).length;

        // The actions haven't been saved in the database yet -> keep them
        this.restore(activeExercise, true);
        return activeExercise;
    }

    public fromDatabase(
        exerciseEntry: ExerciseEntry,
        actions: ActionEntry[]
    ): ActiveExercise {
        const actionsInWrapper: ActionWrapper[] = [];
        const exercise = new ActiveExercise(exerciseEntry, actionsInWrapper);
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
        exercise.markAsSaved();
        return exercise;
    }

    public async fromExerciseTemplate(
        exerciseTemplate: ExerciseTemplateEntry,
        exercise: ExerciseEntry,
        type: ExerciseType = 'standalone',
        optionalData: Partial<ExerciseInsert> = {}
    ): Promise<ActiveExercise> {
        const exerciseKeys = await this.createKeys();
        const stateString = {
            ...exercise.currentStateString,
            participantKey: exerciseKeys.participantKey,
            type,
        };
        const newExerciseEntry = {
            ...optionalData,
            ...exerciseKeys,
            stateVersion: exercise.stateVersion,
            initialStateString: stateString,
            currentStateString: stateString,
            baseTemplateId: exerciseTemplate.id,
        };
        const newExercise =
            await this.exerciseService.createExercise(newExerciseEntry);
        return new ActiveExercise(newExercise, []);
    }

    public restore(activeExercise: ActiveExercise, keepActions: boolean): void {
        const exercise = activeExercise.exercise;

        // Check State Version
        if (exercise.stateVersion !== ExerciseState.currentStateVersion) {
            throw new RestoreError(
                `The exercise was created with an incompatible version of the state (got version ${exercise.stateVersion}, required version ${ExerciseState.currentStateVersion})`,
                activeExercise.exercise.id
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
        const exercise = activeExercise.exercise;
        let currentState = cloneDeep(exercise.initialStateString);

        activeExercise.temporaryActionHistory.forEach((actionWrapper) => {
            this.validateAction(actionWrapper.getAction().actionString);
            try {
                currentState = produce(currentState, (draftState) =>
                    applyAction(
                        draftState,
                        actionWrapper.getAction().actionString
                    )
                );
            } catch (e: unknown) {
                if (e instanceof ReducerError) {
                    throw new RestoreError(
                        `A reducer error occurred while restoring (Action ${
                            actionWrapper.getAction().index
                        }: \`${JSON.stringify(actionWrapper.getAction().actionString)}\`)`,
                        activeExercise.exercise.id,
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
