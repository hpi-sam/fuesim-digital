import { jest } from '@jest/globals';
import { uuid } from 'fuesim-digital-shared';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import {
    createExercise,
    createExerciseTemplate,
    createTestEnvironment,
    createTestUserSession,
} from '../../test/utils.js';

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
        const exercise =
            await environment.services.exerciseService.getExerciseByKey(
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

        const saveUnsavedExercises = async () =>
            environment.services.exerciseService.saveUnsavedExercises();
        await saveUnsavedExercises();

        expect(markAsAboutToBeSavedMock).toHaveBeenCalledTimes(1);
        // one action still unsaved
        expect(exercise.temporaryActionHistory.length).toBe(1);

        markAsAboutToBeSaved();
        await saveUnsavedExercises();
        expect(markAsAboutToBeSavedMock).toHaveBeenCalledTimes(2);
        expect(exercise.temporaryActionHistory.length).toBe(0);
    });
    it('does correctly update lastUsedAt', async () => {
        const exerciseKeys = await createExercise(environment);
        const exercise =
            await environment.services.exerciseService.getExerciseByKey(
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

        await environment.services.exerciseService.saveUnsavedExercises();

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
        const sessionInformation =
            (await environment.services.authService.getDataFromSessionToken(
                session
            ))!;

        const exerciseTemplate = await createExerciseTemplate(
            environment,
            session
        );
        const exercise =
            await environment.services.exerciseService.getExerciseByKey(
                exerciseTemplate.trainerKey,
                sessionInformation
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

        await environment.services.exerciseService.saveUnsavedExercises();

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

    describe('upkeep tick', () => {
        it('unloads exercises with no clients', async () => {
            const exerciseKeys = await createExercise(environment);
            const exerciseMap =
                environment.services.exerciseService.TESTING_getExerciseMap();
            // Ensure exercise is loaded into in-memory map
            await environment.services.exerciseService.getExerciseByKey(
                exerciseKeys.trainerKey
            );
            expect(exerciseMap.has(exerciseKeys.trainerKey)).toBe(true);

            await environment.server.exerciseUpkeepTick();

            expect(exerciseMap.has(exerciseKeys.trainerKey)).toBe(false);
            expect(exerciseMap.has(exerciseKeys.participantKey)).toBe(false);
        });

        it('keeps exercises with active clients', async () => {
            const exerciseKeys = await createExercise(environment);
            const exerciseMap =
                environment.services.exerciseService.TESTING_getExerciseMap();

            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exerciseKeys.trainerKey,
                    'Test'
                );
                expect(join.success).toBe(true);

                await environment.server.exerciseUpkeepTick();

                expect(exerciseMap.has(exerciseKeys.trainerKey)).toBe(true);
            });
        });
    });
});
