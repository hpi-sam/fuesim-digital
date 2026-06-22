import { jest } from '@jest/globals';
import { uuid } from 'fuesim-digital-shared';
import { eq } from 'drizzle-orm';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import {
    createExercise,
    createExerciseTemplate,
    createTestEnvironment,
    createTestUserSession,
} from '../../test/utils.js';
import { exerciseTable } from '../schema.js';
import { createParallelExercise } from '../../test/parallel-exercise-utils.js';
import { Config } from '../../config.js';

describe('Exercise-Service', () => {
    const environment = createTestEnvironment();

    // TODO: This test heavily relies on implementation details.
    // When refactoring any part of the application that may impact this test and make it fail, it's ok to change it.
    // The problem that should be catched by it:
    // The `FuesimServer` calls "ExerciseService" every 10 seconds to save all exercises.
    // After saving, the actions are removed from memory.
    // As the saving happens asynchronously, it's possible that an action gets added between collecting the actions to be saved and removing the actions.
    // In a naive implementation it can happen that such actions get removed from memory without being saved to the database.
    it('does not throw away actions while saving', async () => {
        const exerciseKeys = await createExercise(environment);
        const exercise = environment.services.exerciseService.getExerciseByKey(
            exerciseKeys.trainerKey
        );
        const markAsAboutToBeSaved =
            exercise.markAsAboutToBeSaved.bind(exercise);

        // remove implementation to prevent calling this again
        // simulates adding action after calling "markAsAboutToBeSaved", see above
        const markAsAboutToBeSavedMock = jest
            .spyOn(ActiveExercise.prototype, 'markAsAboutToBeSaved')
            .mockImplementation(() => {
                /* empty */
            });

        markAsAboutToBeSaved();
        exercise.applyAction(
            {
                type: '[AlarmGroup] Add AlarmGroup',
                alarmGroup: {
                    alarmGroupVehicles: {},
                    id: uuid(),
                    type: 'alarmGroup',
                    name: 'Alarm Group',
                    triggerCount: 0,
                    triggerLimit: null,
                },
            },
            null
        );

        const saveTick: () => Promise<void> = (
            environment.server as any
        ).saveTick.bind(environment.server);
        await saveTick();

        expect(markAsAboutToBeSavedMock).toHaveBeenCalledTimes(1);
        // one action still unsaved
        expect(exercise.temporaryActionHistory.length).toBe(1);

        markAsAboutToBeSaved();
        await saveTick();
        expect(markAsAboutToBeSavedMock).toHaveBeenCalledTimes(2);
        expect(exercise.temporaryActionHistory.length).toBe(0);
    });
    it('does correctly update lastUsedAt', async () => {
        const exerciseKeys = await createExercise(environment);
        const exercise = environment.services.exerciseService.getExerciseByKey(
            exerciseKeys.trainerKey
        );
        const beforeAction = Date.now();
        exercise.applyAction(
            {
                type: '[AlarmGroup] Add AlarmGroup',
                alarmGroup: {
                    alarmGroupVehicles: {},
                    id: uuid(),
                    type: 'alarmGroup',
                    name: 'Alarm Group',
                    triggerCount: 0,
                    triggerLimit: null,
                },
            },
            null
        );

        await environment.server.saveTick();

        const exerciseEntry =
            await environment.repositories.exerciseRepository.getExerciseById(
                exercise.exercise.id
            );

        expect(exerciseEntry!.lastUsedAt.getTime()).toBeGreaterThan(
            beforeAction
        );
        expect(exerciseEntry!.lastUsedAt.getTime()).toBeLessThan(Date.now());
    });
    it('does correctly update lastUpdatedAt for exercise templates', async () => {
        const session = await createTestUserSession(environment);
        const exerciseTemplate = await createExerciseTemplate(
            environment,
            session
        );
        const exercise = environment.services.exerciseService
            .TESTING_getExerciseMap()
            .get(exerciseTemplate.trainerKey)!;
        const beforeAction = Date.now();
        exercise.applyAction(
            {
                type: '[AlarmGroup] Add AlarmGroup',
                alarmGroup: {
                    alarmGroupVehicles: {},
                    id: uuid(),
                    type: 'alarmGroup',
                    name: 'Alarm Group',
                    triggerCount: 0,
                    triggerLimit: null,
                },
            },
            null
        );

        await environment.server.saveTick();

        const exerciseTemplateEntry =
            await environment.repositories.exerciseRepository.getExerciseTemplateById(
                exerciseTemplate.id
            );

        expect(exerciseTemplateEntry!.lastUpdatedAt.getTime()).toBeGreaterThan(
            beforeAction
        );
        expect(exerciseTemplateEntry!.lastUpdatedAt.getTime()).toBeLessThan(
            Date.now()
        );
    });

    describe('delete unused exercises', () => {
        let session: string;
        beforeEach(async () => {
            session = await createTestUserSession(environment);
        });

        describe.each([
            [
                'not anonymous',
                async () =>
                    (await createExercise(environment, session)).trainerKey,
            ],
            [
                'template',
                async () =>
                    (await createExerciseTemplate(environment, session))
                        .trainerKey,
            ],
            [
                'part of parallel exercise',
                async () => {
                    const parallelExercise = await createParallelExercise(
                        environment,
                        session
                    );
                    const exercise =
                        await environment.services.parallelExerciseService.joinParallelExerciseByParticipantKey(
                            parallelExercise.participantKey
                        );
                    return exercise.trainerKey;
                },
            ],
        ])('an outdated exercise if %s', (_, getTrainerKey) => {
            it('should not be deleted', async () => {
                const trainerKey = await getTrainerKey();
                const oldDate = new Date();
                oldDate.setDate(
                    oldDate.getDate() - (Config.autoDeleteDays + 1)
                );
                await environment.services.databaseService.databaseConnection
                    .update(exerciseTable)
                    .set({ lastUsedAt: oldDate })
                    .where(eq(exerciseTable.trainerKey, trainerKey))
                    .returning();

                await environment.services.exerciseService.deleteUnusedExercises();

                const result =
                    await environment.services.databaseService.databaseConnection
                        .select()
                        .from(exerciseTable)
                        .where(eq(exerciseTable.trainerKey, trainerKey));

                expect(result.length).toBe(1);
                expect(
                    environment.services.exerciseService
                        .TESTING_getExerciseMap()
                        .get(trainerKey)
                ).toBeDefined();
            });
        });

        it('should delete outdated exercises', async () => {
            const exerciseNotToDelete = await createExercise(environment);
            const newDate = new Date();
            newDate.setDate(newDate.getDate() - Config.autoDeleteDays);
            console.log(newDate);
            newDate.setMinutes(newDate.getMinutes() + 1);
            console.log(newDate);
            await environment.services.databaseService.databaseConnection
                .update(exerciseTable)
                .set({ lastUsedAt: newDate })
                .where(
                    eq(
                        exerciseTable.participantKey,
                        exerciseNotToDelete.participantKey
                    )
                )
                .returning();

            const exerciseToDelete = await createExercise(environment);
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - (Config.autoDeleteDays + 1));
            await environment.services.databaseService.databaseConnection
                .update(exerciseTable)
                .set({ lastUsedAt: oldDate })
                .where(
                    eq(
                        exerciseTable.participantKey,
                        exerciseToDelete.participantKey
                    )
                )
                .returning();

            await environment.services.exerciseService.deleteUnusedExercises();

            const result =
                await environment.services.databaseService.databaseConnection
                    .select({ trainerKey: exerciseTable.trainerKey })
                    .from(exerciseTable);

            expect(result.length).toEqual(1);
            expect(result[0]!.trainerKey).toEqual(
                exerciseNotToDelete.trainerKey
            );
            expect(
                environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(exerciseNotToDelete.trainerKey)
            ).toBeDefined();
            expect(
                environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(exerciseToDelete.trainerKey)
            ).toBeUndefined();
        });
    });
});
