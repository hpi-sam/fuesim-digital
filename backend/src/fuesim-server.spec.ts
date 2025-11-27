import { uuid } from 'digital-fuesim-manv-shared';
import { createExercise, createTestEnvironment } from '../test/utils.js';
import { Config } from './config.js';
import { exerciseMap } from './exercise/exercise-map.js';

describe('Exercise saving', () => {
    const environment = createTestEnvironment();

    // TODO: This test heavily relies on implementation details.
    // When refactoring any part of the application that may impact this test and make it fail, it's ok to change it.
    // The problem that should be catched by it:
    // The `FuesimServer` saves all actions every ten seconds.
    // After saving, the actions are removed from memory.
    // As the saving happens asynchronously, it's possible that an action gets added between collecting the actions to be saved and removing the actions.
    // In a naive implementation it can happen that such actions get removed from memory without being saved to the database.
    it('does not throw away actions while saving', async () => {
        // Only run this test when a database gets used
        expect(Config.useDb).toBe(true);

        const exercideIds = await createExercise(environment);
        const exercise = exerciseMap.get(exercideIds.trainerId)!;

        exercise.markAsAboutToBeSaved();

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

        const saveTick: () => Promise<void> = (environment.server as any)
            .saveTick;
        await saveTick();

        // one action still unsaved
        expect(exercise.temporaryActionHistory.length).toBe(1);
    });
});
