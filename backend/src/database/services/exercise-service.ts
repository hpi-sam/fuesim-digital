import type {
    StateExport,
    ExerciseId,
    ExerciseKey,
    ExerciseTimeline,
    ParticipantKey,
    TrainerKey,
} from 'fuesim-digital-shared';
import {
    isTrainerKey,
    migrateStateExport,
    validateExerciseExport,
    ReducerError,
    newExerciseState,
    currentStateVersion,
} from 'fuesim-digital-shared';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import { pushAll } from '../../utils/array.js';
import { migrateInDatabase } from '../migrate-in-database.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { ExerciseInsert } from '../schema.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';

export class ExerciseService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository
    ) {}

    private readonly exerciseMap = new Map<
        ExerciseId | ExerciseKey,
        ActiveExercise
    >();

    public getExerciseByKey(
        exerciseKey: ExerciseKey,
        session?: SessionInformation
    ) {
        const exercise = this.exerciseMap.get(exerciseKey);
        if (!exercise) {
            throw new NotFoundError();
        }

        if (
            exercise.template &&
            (exercise.template.user !== session?.user.id ||
                !isTrainerKey(exerciseKey))
        ) {
            throw new PermissionDeniedError();
        }
        return exercise;
    }

    public getAllExercises() {
        return new Set(this.exerciseMap.values());
    }

    public async loadExercise(activeExercise: ActiveExercise) {
        this.exerciseMap.set(activeExercise.participantKey, activeExercise);
        this.exerciseMap.set(activeExercise.trainerKey, activeExercise);
        this.exerciseMap.set(activeExercise.exercise.id, activeExercise);
    }

    /**
     * Removes `exercise` from the set of active exercises
     */
    public unloadExercise(exercise: ActiveExercise) {
        exercise.unload();

        this.exerciseMap.delete(exercise.participantKey);
        this.exerciseMap.delete(exercise.trainerKey);
        this.exerciseMap.delete(exercise.exercise.id);
    }

    public async createExerciseFromBlank(
        optionalData: Partial<ExerciseInsert> = {}
    ): Promise<ActiveExercise> {
        return this.exerciseRepository.transaction(
            async (exerciseRepository) => {
                const accessKeyRepository = new AccessKeyRepository(
                    exerciseRepository
                );

                const participantKey =
                    await accessKeyRepository.generateKey<ParticipantKey>(6);
                const trainerKey =
                    await accessKeyRepository.generateKey<TrainerKey>(8);

                const initialState = newExerciseState(participantKey);
                const exerciseInsert = {
                    ...optionalData,
                    participantKey,
                    trainerKey,
                    initialStateString: initialState,
                    currentStateString: initialState,
                    stateVersion: currentStateVersion,
                } satisfies ExerciseInsert;

                const exerciseEntry =
                    await exerciseRepository.createExercise(exerciseInsert);
                if (!exerciseEntry) throw new ApiError();

                const activeExercise = new ActiveExercise(exerciseEntry);
                await this.loadExercise(activeExercise);
                return activeExercise;
            }
        );
    }

    public async createExerciseFromFile(
        file: StateExport,
        optionalData: Partial<ExerciseInsert> = {}
    ): Promise<ActiveExercise> {
        return this.exerciseRepository.transaction(
            async (exerciseRepository) => {
                const accessKeyRepository = new AccessKeyRepository(
                    exerciseRepository
                );

                try {
                    const participantKey =
                        await accessKeyRepository.generateKey<ParticipantKey>(
                            6
                        );
                    const trainerKey =
                        await accessKeyRepository.generateKey<TrainerKey>(8);

                    const migratedImportObject = migrateStateExport(file);
                    validateExerciseExport(migratedImportObject);

                    const newInitialState = {
                        ...(migratedImportObject.history?.initialState ??
                            migratedImportObject.currentState),
                        participantKey,
                    };
                    const newCurrentState = {
                        ...migratedImportObject.currentState,
                        participantKey,
                    };

                    const exerciseInsert = {
                        ...optionalData,
                        participantKey,
                        trainerKey,
                        initialStateString: newInitialState,
                        currentStateString: newCurrentState,
                        stateVersion: currentStateVersion,
                    } satisfies ExerciseInsert;
                    const exerciseEntry =
                        await exerciseRepository.createExercise(exerciseInsert);
                    if (!exerciseEntry) throw new ApiError();

                    const activeExercise = new ActiveExercise(exerciseEntry);

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
                            action.getAction().actionString.type ===
                            '[Exercise] Tick'
                    ).length;

                    // The actions haven't been saved in the database yet -> keep them
                    activeExercise.restore(true);

                    await this.loadExercise(activeExercise);

                    return activeExercise;
                } catch (err) {
                    if (err instanceof ZodError) {
                        throw new ApiError(
                            `The validation of the import failed: ${err.error}`
                        );
                    }
                    if (err instanceof ReducerError) {
                        throw new ApiError(
                            `Error importing exercise: ${err.message}`
                        );
                    }
                    throw err;
                }
            }
        );
    }

    /**
     * Restore all Exercises from Database; called on startup
     */
    public async restoreAllExercises(): Promise<ActiveExercise[]> {
        return this.exerciseRepository.transaction(
            async (exerciseRepoTransaction) => {
                console.log('Migrate outdated exercises in database…');

                const outdatedExercises =
                    await exerciseRepoTransaction.getOutdatedExercises();
                const outdatedExercisesCount = outdatedExercises.length;

                let index = 1;
                for (const exercise of outdatedExercises) {
                    console.log(
                        `Migrate exercise ${index} of ${outdatedExercisesCount} (${exercise.id})`
                    );
                    // eslint-disable-next-line no-await-in-loop
                    await migrateInDatabase(
                        exercise.id,
                        exerciseRepoTransaction,
                        this.actionRepository.withConnection(
                            exerciseRepoTransaction
                        )
                    );
                    index++;
                }

                console.log(
                    'Finished migrating outdated exercises in database…'
                );

                const exercises = await Promise.all(
                    (await exerciseRepoTransaction.getAllExercises()).map(
                        async (exerciseEntity) => {
                            const exercise = new ActiveExercise(exerciseEntity);
                            exercise.template = exerciseEntity.template ?? null;

                            // Load all actions
                            pushAll(
                                exercise.temporaryActionHistory,
                                (
                                    await this.actionRepository
                                        .withConnection(exerciseRepoTransaction)
                                        .getActionsForExerciseId(
                                            exerciseEntity.id
                                        )
                                ).map(
                                    (actionEntity) =>
                                        new ActionWrapper(
                                            actionEntity.actionString,
                                            actionEntity.emitterId,
                                            exercise,
                                            actionEntity.index,
                                            actionEntity.id
                                        )
                                )
                            );
                            return exercise;
                        }
                    )
                );
                await Promise.all(
                    // The actions have already been saved in the database -> do not keep them
                    exercises.map(async (exercise) => exercise.restore(false))
                );
                exercises.forEach((exercise) => {
                    this.exerciseMap.set(exercise.participantKey, exercise);
                    this.exerciseMap.set(exercise.trainerKey, exercise);
                    this.exerciseMap.set(exercise.exercise.id, exercise);
                    this.loadExercise(exercise);
                });
                return exercises;
            }
        );
    }

    /**
     * Deletes an exercise from the database and unloads it from the server
     * @param exerciseKey the trainerKey of the deleting trainer
     *                    (participants are not authorized)
     * @param session optionally, the session of a logged-in user. User-owned
     *                exercises can only be deleted by themselves
     */
    public async deleteExercise(
        exerciseKey: ExerciseKey,
        session?: SessionInformation
    ) {
        if (!isTrainerKey(exerciseKey)) {
            throw new PermissionDeniedError();
        }

        const activeExercise = this.getExerciseByKey(exerciseKey, session);

        const exerciseEntry = await this.exerciseRepository.getExerciseById(
            activeExercise.exercise.id
        );
        if (!exerciseEntry) {
            throw new NotFoundError();
        }

        if (exerciseEntry.template) {
            throw new PermissionDeniedError();
        }
        if (exerciseEntry.user && exerciseEntry.user !== session?.user.id) {
            throw new PermissionDeniedError();
        }

        this.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseById(
            activeExercise.exercise.id
        );
    }

    public async saveUnsavedExercises() {
        return this.exerciseRepository.transaction(async (repoTransaction) => {
            await Promise.all(
                [...this.getAllExercises()]
                    .filter((f) => f.changedSinceSave)
                    .map(async (activeExercise) => {
                        activeExercise.markAsAboutToBeSaved();
                        await repoTransaction.saveExerciseState(
                            activeExercise.exercise
                        );
                        if (activeExercise.template) {
                            await repoTransaction.updateExerciseTemplate(
                                activeExercise.template.id,
                                {}
                            );
                        }

                        await this.actionRepository
                            .withConnection(repoTransaction)
                            .saveActions(activeExercise.getSavableActions());

                        activeExercise.markAsSaved();
                    })
            );
        });
    }

    public async getTimeline(
        exerciseKey: ExerciseKey,
        session?: SessionInformation
    ): Promise<ExerciseTimeline> {
        const activeExercise = this.getExerciseByKey(exerciseKey, session);
        const completeHistory: ExerciseTimeline['actionsWrappers'] = [
            ...(
                await this.actionRepository.getActionsForExerciseId(
                    activeExercise.exercise.id
                )
            ).map((action) => ({
                action: action.actionString,
                emitterId: action.emitterId,
                time: action.index,
            })),
            ...activeExercise.temporaryActionHistory.map((actionWrapper) => ({
                action: actionWrapper.getAction().actionString,
                emitterId: actionWrapper.getAction().emitterId,
                time: actionWrapper.getAction().index,
            })),
        ]
            // TODO: Is this necessary?
            .sort((a, b) => a.time - b.time);

        return {
            initialState: activeExercise.exercise.initialStateString,
            actionsWrappers: completeHistory,
        };
    }

    public getExercisesViewportsById(id: ExerciseId) {
        const activeExercise = this.exerciseMap.get(id);
        if (!activeExercise) {
            throw new NotFoundError();
        }
        return Object.values(
            activeExercise.exercise.currentStateString.viewports
        );
    }

    /**
     * THIS SHOULD ONLY BE USED FOR TESTING PURPOSES
     */
    public TESTING_getExerciseMap() {
        return this.exerciseMap;
    }
}
