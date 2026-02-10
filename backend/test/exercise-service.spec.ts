import { jest } from '@jest/globals';
import { uuid } from 'digital-fuesim-manv-shared';
import { ActiveExercise } from '../src/exercise/active-exercise.js';
import { createExercise, createTestEnvironment } from './utils.js';

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
        const exercideIds = await createExercise(environment);
        const exercise = environment.exerciseService.getExerciseByKey(
            exercideIds.trainerId
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
                    sent: false,
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
});
