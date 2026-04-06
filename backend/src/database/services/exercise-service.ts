import {
    type ExerciseId,
    isTrainerKey,
    type ExerciseKey,
    type ExerciseTimeline,
} from 'fuesim-digital-shared';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { removeAll, pushAll } from '../../utils/array.js';
import { migrateInDatabase } from '../migrate-in-database.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { ExerciseInsert } from '../schema.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import { NotFoundError, PermissionDeniedError } from '../../utils/http.js';
import type { AccessKeyService } from './access-key-service.js';

export class ExerciseService {
    public readonly exerciseFactory: ExerciseFactory;

    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository,
        private readonly accessKeyService: AccessKeyService
    ) {
        this.exerciseFactory = new ExerciseFactory(accessKeyService, this);
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
            (exercise.template.userId !== session?.user.id ||
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

    public async freeExerciseKeys(exercise: ActiveExercise) {
        await this.accessKeyService.free(exercise.participantKey);
        await this.accessKeyService.free(exercise.trainerKey);
    }

    public async createExercise(exercise: ExerciseInsert) {
        const exerciseEntry =
            await this.exerciseRepository.createExercise(exercise);
        await this.accessKeyService.lock([
            exercise.participantKey,
            exercise.trainerKey,
        ]);
        return exerciseEntry!;
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

                const exercises = await Promise.all(
                    (await exerciseRepoTransaction.getAllExercises()).map(
                        async (exerciseEntity) => {
                            const actions = await this.actionRepository
                                .withConnection(exerciseRepoTransaction)
                                .getActionsForExerciseId(exerciseEntity.id);

                            const exercise = this.exerciseFactory.fromDatabase(
                                exerciseEntity,
                                actions
                            );
                            exercise.template = exerciseEntity.template ?? null;
                            removeAll(exercise.temporaryActionHistory);

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
                    exercises.map(async (exercise) =>
                        this.exerciseFactory.restore(exercise, false)
                    )
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
        if (exerciseEntry.userId && exerciseEntry.userId !== session?.user.id) {
            throw new PermissionDeniedError();
        }

        this.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseById(
            activeExercise.exercise.id
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
