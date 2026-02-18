import {
    isTrainerKey,
    type ExerciseKey,
    type ExerciseTimeline,
} from 'fuesim-digital-shared';
import type { InferInsertModel } from 'drizzle-orm';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import type { ClientWrapper } from '../../exercise/client-wrapper.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { removeAll, pushAll } from '../../utils/array.js';
import { migrateInDatabase } from '../migrate-in-database.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type {
    ExerciseId,
    exerciseTable,
    ExerciseTemplateEntry,
} from '../schema.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { AccessKeyService } from './access-key-service.js';

export class ExerciseService {
    public readonly exerciseFactory: ExerciseFactory;

    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository,
        private readonly accessKeyService: AccessKeyService
    ) {
        this.exerciseFactory = new ExerciseFactory(accessKeyService);
    }

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

    /**
     * Removes `exercise` from the set of active exercises
     */
    public unloadExercise(exercise: ActiveExercise) {
        exercise.unload();

        this.exerciseMap.delete(exercise.participantKey);
        this.exerciseMap.delete(exercise.trainerKey);
        this.exerciseMap.delete(exercise.exerciseId);
    }

    public async freeExerciseKeys(exercise: ActiveExercise) {
        await this.accessKeyService.free(exercise.participantKey);
        await this.accessKeyService.free(exercise.trainerKey);
    }

    public async createTemplate(
        templateExercise: ActiveExercise,
        exerciseTemplate: ExerciseTemplateEntry
    ) {
        templateExercise.template = exerciseTemplate;
        await this.createExercise(templateExercise, {
            templateId: exerciseTemplate.id,
        });
    }

    public async createExercise(
        activeExercise: ActiveExercise,
        optionalData?: Partial<InferInsertModel<typeof exerciseTable>>
    ) {
        const result = await this.exerciseRepository.createExercise(
            activeExercise,
            optionalData
        );
        activeExercise.setExerciseId(result!.id);

        this.exerciseMap.set(activeExercise.participantKey, activeExercise);
        this.exerciseMap.set(activeExercise.trainerKey, activeExercise);
        this.exerciseMap.set(activeExercise.exerciseId, activeExercise);
        await this.accessKeyService.lock([
            activeExercise.participantKey,
            activeExercise.trainerKey,
        ]);
    }

    public leaveExercise(exerciseKey: ExerciseKey, client: ClientWrapper) {
        this.getExerciseByKey(exerciseKey, client.session).removeClient(client);
    }

    /**
     * Restore all Exercises from Database; called on startup
     */
    public async restoreAllExercises(): Promise<ActiveExercise[]> {
        return this.exerciseRepository.transaction(
            async (exerciseRepoTransaction) => {
                const outdatedExercises =
                    await exerciseRepoTransaction.getOutdatedExercises();

                await Promise.all(
                    outdatedExercises.map(async (exercise) => {
                        await migrateInDatabase(
                            exercise.id,
                            exerciseRepoTransaction,
                            this.actionRepository.withConnection(
                                exerciseRepoTransaction
                            )
                        );
                    })
                );

                const keys: ExerciseKey[] = [];
                const exercises = await Promise.all(
                    (await exerciseRepoTransaction.getAllExercises()).map(
                        async (exerciseEntity) => {
                            const actions = await this.actionRepository
                                .withConnection(exerciseRepoTransaction)
                                .getActionsForExerciseId(
                                    exerciseEntity.exercise_entity.id
                                );

                            const exercise = this.exerciseFactory.fromDatabase(
                                exerciseEntity.exercise_entity,
                                actions
                            );
                            exercise.template =
                                exerciseEntity.exercise_template;
                            removeAll(exercise.temporaryActionHistory);

                            // Load all actions
                            pushAll(
                                exercise.temporaryActionHistory,
                                (
                                    await this.actionRepository
                                        .withConnection(exerciseRepoTransaction)
                                        .getActionsForExerciseId(
                                            exerciseEntity.exercise_entity.id
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
                    exercises.map(async (exercise) =>
                        this.exerciseFactory.restore(exercise, false)
                    )
                );
                exercises.forEach((exercise) => {
                    this.exerciseMap.set(exercise.participantKey, exercise);
                    this.exerciseMap.set(exercise.trainerKey, exercise);
                    this.exerciseMap.set(exercise.exerciseId, exercise);
                    keys.push(exercise.participantKey, exercise.trainerKey);
                });
                await this.accessKeyService.lock(keys);
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
            activeExercise.exerciseId
        );
        if (!exerciseEntry) {
            throw new NotFoundError();
        }

        if (exerciseEntry.exercise_template) {
            throw new PermissionDeniedError();
        }
        if (
            exerciseEntry.exercise_entity.user &&
            exerciseEntry.exercise_entity.user !== session?.user.id
        ) {
            throw new PermissionDeniedError();
        }

        this.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseById(
            activeExercise.exerciseId
        );
        await this.freeExerciseKeys(activeExercise);
    }

    public async saveUnsavedExercises() {
        return this.exerciseRepository.transaction(async (repoTransaction) => {
            await Promise.all(
                [...this.getAllExercises()]
                    .filter((f) => f.changedSinceSave)
                    .map(async (activeExercise) => {
                        activeExercise.markAsAboutToBeSaved();
                        await repoTransaction.saveExerciseState(
                            activeExercise.exerciseId,
                            activeExercise.getExercise()
                        );

                        await this.actionRepository
                            .withConnection(repoTransaction)
                            .saveActions(activeExercise.getSaveableActions());

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
                    activeExercise.exerciseId
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
            initialState: activeExercise.getExercise().initialStateString,
            actionsWrappers: completeHistory,
        };
    }

    public getExercisesViewportsById(id: ExerciseId) {
        const activeExercise = this.exerciseMap.get(id);
        if (!activeExercise) {
            throw new NotFoundError();
        }
        return Object.values(
            activeExercise.getExercise().currentStateString.viewports
        );
    }

    /**
     * THIS SHOULD ONLY BE USED FOR TESTING PURPOSES
     */
    public TESTING_getExerciseMap() {
        return this.exerciseMap;
    }
}
