import type { ExerciseWrapper } from 'exercise/exercise-wrapper.js';
import { migrateInDatabase } from 'database/migrate-in-database.js';
import type {
    ExerciseIds,
    ExerciseTimeline,
    Role,
} from 'digital-fuesim-manv-shared';
import { ActionWrapper } from 'exercise/action-wrapper.js';
import { pushAll, removeAll } from 'utils/array.js';
import { UserReadableIdGenerator } from 'utils/user-readable-id-generator.js';
import type { ExerciseRepository } from 'database/repositories/exercise-repository.js';
import type { ActionRepository } from 'database/repositories/action-repository.js';
import { ExerciseFactory } from 'exercise/exercise-factory.js';
import type { ClientWrapper } from 'exercise/client-wrapper.js';

export class ExerciseService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository
    ) {}

    private readonly exerciseMap = new Map<string, ExerciseWrapper>();

    public hasExerciseId(exerciseId: string) {
        return this.exerciseMap.has(exerciseId);
    }

    public getExerciseById(exerciseId: string) {
        return this.exerciseMap.get(exerciseId);
    }

    public async loadExercise(
        exerciseWrapper: ExerciseWrapper,
        exerciseIds: ExerciseIds
    ) {
        this.exerciseMap.set(exerciseIds.participantId, exerciseWrapper);
        this.exerciseMap.set(exerciseIds.trainerId, exerciseWrapper);
        UserReadableIdGenerator.lock(Object.values(exerciseIds));
    }

    public leaveExercise(exercisePublicId: string, client: ClientWrapper) {
        this.getExerciseById(exercisePublicId)?.removeClient(client);
    }

    /**
     * Restore all Exercises from Database; called on startup
     */
    public async restoreAllExercises(): Promise<ExerciseWrapper[]> {
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
                            const exercise =
                                ExerciseFactory.fromDatabase(exerciseEntity);
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
                        ExerciseFactory.restore(exercise, false)
                    )
                );
                exercises.forEach((exercise) => {
                    this.exerciseMap.set(
                        exercise.getExercise().participantId,
                        exercise
                    );
                    this.exerciseMap.set(
                        exercise.getExercise().trainerId,
                        exercise
                    );
                });
                UserReadableIdGenerator.lock([...this.exerciseMap.keys()]);
                return exercises;
            }
        );
    }

    public async deleteExercise(publicId: string) {
        const exerciseWrapper = this.getExerciseById(publicId);
        if (!exerciseWrapper) {
            console.warn(
                `Tried to delete non-existing exercise with id ${publicId}`
            );
            throw new UnknownExerciseError(publicId);
        }

        exerciseWrapper.destroy();

        const exercise = exerciseWrapper.getExercise();
        this.exerciseMap.delete(exercise.participantId);
        this.exerciseMap.delete(exercise.trainerId);
        await this.exerciseRepository.deleteExerciseById(exercise.id ?? '');
        exerciseWrapper.markAsSaved();
    }

    public async saveUnsavedExercises() {
        return this.exerciseRepository.transaction(async (repoTransaction) => {
            await Promise.all(
                [...this.exerciseMap.entries()]
                    .filter((f) => f[0].length === 8 && f[1].changedSinceSave)
                    .map((m) => m[1])
                    .map((exerciseWrapper) => async () => {
                        await repoTransaction.transaction(
                            async (exerciseTransaction) => {
                                exerciseWrapper.markAsAboutToBeSaved();

                                await exerciseTransaction.saveExerciseState(
                                    exerciseWrapper.getExercise()
                                );

                                await this.actionRepository
                                    .withConnection(exerciseTransaction)
                                    .saveActions(
                                        exerciseWrapper.getSaveableActions()
                                    );

                                exerciseWrapper.markAsSaved();
                            }
                        );
                    })
            );
        });
    }

    public async getTimeline(exerciseId: string): Promise<ExerciseTimeline> {
        const exerciseWrapper = this.getExerciseById(exerciseId);
        if (exerciseWrapper === undefined)
            throw new UnknownExerciseError(exerciseId);
        const completeHistory: ExerciseTimeline['actionsWrappers'] = [
            ...(
                await this.actionRepository.getActionsForExerciseId(exerciseId)
            ).map((action) => ({
                action: action.actionString,
                emitterId: action.emitterId,
                time: action.index,
            })),
            ...exerciseWrapper.temporaryActionHistory.map((actionWrapper) => ({
                action: actionWrapper.getAction().actionString,
                emitterId: actionWrapper.getAction().emitterId,
                time: actionWrapper.getAction().index,
            })),
        ]
            // TODO: Is this necessary? (@Quixelation :--> old comment from prev)
            .sort((a, b) => a.time - b.time);

        return {
            initialState: exerciseWrapper.getExercise().initialStateString,
            actionsWrappers: completeHistory,
        };
    }

    public getRoleFromId(id: string): Role {
        switch (id.length) {
            case 6:
                return 'participant';
            case 8:
                return 'trainer';
            default:
                throw new RangeError(`Incorrect id: ${id}`);
        }
    }
}

export class UnknownExerciseError extends Error {
    public constructor(exerciseId: string) {
        super(
            `Exercise with id ${exerciseId} was requested but not found on server`
        );
    }
}
