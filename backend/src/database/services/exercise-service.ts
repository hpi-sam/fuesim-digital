import type { ExerciseTimeline, Role } from 'digital-fuesim-manv-shared';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import type { ClientWrapper } from '../../exercise/client-wrapper.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { removeAll, pushAll } from '../../utils/array.js';
import { UserReadableIdGenerator } from '../../utils/user-readable-id-generator.js';
import { migrateInDatabase } from '../migrate-in-database.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';

export class ExerciseService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository
    ) {}

    private readonly exerciseMap = new Map<string, ActiveExercise>();

    public hasExerciseKey(exerciseId: string) {
        return this.exerciseMap.has(exerciseId);
    }

    public getExerciseByKey(roleKey: string) {
        return this.exerciseMap.get(roleKey);
    }

    public getAllExercises() {
        return new Set(this.exerciseMap.values());
    }

    public async loadExercise(activeExercise: ActiveExercise) {
        const result =
            await this.exerciseRepository.createExerciseIfNotExists(
                activeExercise
            );
        if (result.length === 1 && result[0]?.id) {
            activeExercise.setExerciseId(result[0].id);
        }

        const exercise = activeExercise.getExercise();
        this.exerciseMap.set(exercise.participantId, activeExercise);
        this.exerciseMap.set(exercise.trainerId, activeExercise);
        UserReadableIdGenerator.lock([
            exercise.participantId,
            exercise.trainerId,
        ]);
    }

    public leaveExercise(exerciseKey: string, client: ClientWrapper) {
        this.getExerciseByKey(exerciseKey)?.removeClient(client);
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

                            const exercise = ExerciseFactory.fromDatabase(
                                exerciseEntity,
                                actions
                            );
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

    public async deleteExercise(exerciseKey: string) {
        const activeExercise = this.getExerciseByKey(exerciseKey);
        if (!activeExercise) {
            throw new UnknownExerciseError(exerciseKey);
        }

        activeExercise.destroy();

        const exercise = activeExercise.getExercise();
        this.exerciseMap.delete(exercise.participantId);
        this.exerciseMap.delete(exercise.trainerId);
        if (activeExercise.exerciseId) {
            // only delete if exercise has been saved before in database
            await this.exerciseRepository.deleteExerciseById(
                activeExercise.exerciseId
            );
        }
        activeExercise.markAsSaved();
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

    public async getTimeline(exerciseKey: string): Promise<ExerciseTimeline> {
        const activeExercise = this.getExerciseByKey(exerciseKey);
        if (activeExercise === undefined)
            throw new UnknownExerciseError(exerciseKey);
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

    /**
     * THIS SHOULD ONLY BE USED FOR TESTING PURPOSES
     */
    public TESTING_getExerciseMap() {
        return this.exerciseMap;
    }
}

export class UnknownExerciseError extends Error {
    public constructor(exerciseId: string) {
        super(
            `Exercise with id ${exerciseId} was requested but not found on server`
        );
    }
}
