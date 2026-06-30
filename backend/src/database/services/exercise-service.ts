import type {
    StateExport,
    ExerciseId,
    ExerciseKey,
    ExerciseTimeline,
    ParticipantKey,
    TrainerKey,
    ExerciseState,
    PostExerciseRequestData,
} from 'fuesim-digital-shared';
import {
    isTrainerKey,
    migrateStateExport,
    validateExerciseExport,
    ReducerError,
    newExerciseState,
    currentStateVersion,
} from 'fuesim-digital-shared';
import { ZodError } from 'zod';
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
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';

export class ExerciseService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository,
        private readonly organisationRepository: OrganisationRepository
    ) {}

    private readonly exerciseMap = new Map<
        ExerciseId | ExerciseKey,
        ActiveExercise
    >();

    public async getExerciseByKey(
        exerciseKey: ExerciseKey,
        session?: SessionInformation
    ) {
        const exercise = this.exerciseMap.get(exerciseKey);
        if (!exercise) {
            throw new NotFoundError();
        }

        if (
            exercise.template &&
            (!session ||
                !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                    exercise.template.organisationId,
                    session.user.id,
                    ['editor', 'admin']
                )) ||
                !isTrainerKey(exerciseKey))
        ) {
            throw new PermissionDeniedError();
        }
        return exercise;
    }

    public getAllExercises() {
        return new Set(this.exerciseMap.values());
    }

    public async getAllExercisesForUser(session: SessionInformation) {
        return this.exerciseRepository.getAllExercisesForUser(session.user.id);
    }

    public loadExercise(activeExercise: ActiveExercise) {
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

    public async createExercise(
        data: PostExerciseRequestData,
        session?: SessionInformation
    ) {
        const { importObject, ...parsedData } = data;

        if (session) {
            // Logged in user
            if (!data.organisationId) {
                throw new ApiError();
            }
            const isEditorOrAdmin =
                await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                    data.organisationId,
                    session.user.id,
                    ['editor', 'admin']
                );
            if (!isEditorOrAdmin) {
                throw new PermissionDeniedError();
            }
        } else {
            // Anonymous exercise
            parsedData.organisationId = null;
        }

        let exercise;
        if (!importObject) {
            exercise = await this.createExerciseFromBlank(parsedData);
        } else {
            exercise = await this.createExerciseFromFile(
                parsedData,
                importObject
            );
        }

        return exercise;
    }

    public async createExerciseFromBlank(
        data: Partial<ExerciseInsert>
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

                const initialState: ExerciseState = {
                    ...newExerciseState(participantKey),
                    type: data.templateId ? 'template' : 'standalone',
                };
                const exerciseInsert = {
                    ...data,
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
                this.loadExercise(activeExercise);
                return activeExercise;
            }
        );
    }

    public async createExerciseFromFile(
        data: Partial<ExerciseInsert>,
        file: StateExport
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

                    const exerciseType = data.templateId
                        ? 'template'
                        : 'standalone';
                    newInitialState.type = exerciseType;
                    newCurrentState.type = exerciseType;

                    const exerciseInsert = {
                        ...data,
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

                    activeExercise.restoreState();
                    this.loadExercise(activeExercise);

                    return activeExercise;
                } catch (err) {
                    if (err instanceof ZodError) {
                        throw new ApiError(
                            `The validation of the import failed: ${err.message}`
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
                    (
                        await exerciseRepoTransaction.getAllExercisesWithActionsCount()
                    ).map(async (exerciseEntity) => {
                        const exercise = new ActiveExercise(exerciseEntity);
                        exercise.template = exerciseEntity.template ?? null;
                        exercise.incrementIdGenerator.setCurrent(
                            exerciseEntity.actionsCount!
                        );
                        exercise.resetStopped();
                        this.loadExercise(exercise);
                        return exercise;
                    })
                );
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

        const activeExercise = await this.getExerciseByKey(
            exerciseKey,
            session
        );

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

        await this.deleteExerciseById(activeExercise.exercise.id);
    }

    public async deleteExerciseById(exerciseId: ExerciseId) {
        const activeExercise = this.exerciseMap.get(exerciseId);
        if (activeExercise) {
            this.unloadExercise(activeExercise);
        }

        await this.exerciseRepository.deleteExerciseById(exerciseId);
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

    public async deleteUnusedExercises() {
        try {
            const exerciseToDelete =
                await this.exerciseRepository.getUnusedExercises();

            await Promise.all(
                exerciseToDelete.map(async (exercise) => {
                    await this.deleteExerciseById(exercise.id);
                })
            );

            if (exerciseToDelete.length > 0) {
                console.log(
                    `Successfully deleted ${exerciseToDelete.length} unused exercises.`
                );
            }
        } catch (error) {
            console.error('Error during deletion of unused exercises:', error);
        }
    }

    public async getTimeline(
        exerciseKey: ExerciseKey,
        session?: SessionInformation
    ): Promise<ExerciseTimeline> {
        const activeExercise = await this.getExerciseByKey(
            exerciseKey,
            session
        );
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
