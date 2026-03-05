import { jest } from '@jest/globals';
import type { ExerciseKey } from 'fuesim-digital-shared';
import { sleep } from 'fuesim-digital-shared';
import { createTestEnvironment } from '../test/utils.js';
import { ActiveExercise } from './active-exercise.js';

describe('Active Exercise', () => {
    const environment = createTestEnvironment();

    it('fails getting a role for the wrong key', async () => {
        const exercise =
            await environment.services.exerciseService.exerciseFactory.fromBlank();

        expect(() =>
            exercise.getRoleFromUsedKey('wrong key' as ExerciseKey)
        ).toThrow(RangeError);
    });

    describe('Started Exercise', () => {
        let exercise: ActiveExercise | undefined;
        beforeEach(async () => {
            exercise =
                await environment.services.exerciseService.exerciseFactory.fromBlank();
            exercise.start();
        });
        afterEach(() => {
            exercise?.pause();
            exercise = undefined;
        });
        it('emits tick event in tick (repeated)', async () => {
            const applySpy = jest.spyOn(
                ActiveExercise.prototype,
                'applyAction'
            );
            const tickInterval = (exercise as any).tickInterval;

            applySpy.mockClear();
            await sleep(tickInterval * 2.01);
            expect(applySpy).toHaveBeenCalledTimes(2);
            let action = applySpy.mock.calls[0]![0];
            expect(action.type).toBe('[Exercise] Tick');
            action = applySpy.mock.calls[1]![0];
            expect(action.type).toBe('[Exercise] Tick');
        });
    });

    describe('Reactions to Actions', () => {
        it('calls start when matching action is sent', async () => {
            const exercise =
                await environment.services.exerciseService.exerciseFactory.fromBlank();

            const startMock = jest.spyOn(ActiveExercise.prototype, 'start');
            startMock.mockImplementation(() => ({}));

            exercise.applyAction(
                { type: '[Exercise] Start' },
                (exercise as any).emitterUUID
            );
            expect(startMock).toHaveBeenCalledTimes(1);
        });

        it('calls pause when matching action is sent', async () => {
            const exercise =
                await environment.services.exerciseService.exerciseFactory.fromBlank();

            const pause = jest.spyOn(ActiveExercise.prototype, 'pause');
            pause.mockImplementation(() => ({}));

            // We have to start the exercise before it can be paused
            exercise.applyAction(
                { type: '[Exercise] Start' },
                (exercise as any).emitterUUID
            );

            exercise.applyAction(
                { type: '[Exercise] Pause' },
                (exercise as any).emitterUUID
            );
            expect(pause).toHaveBeenCalledTimes(1);
        });
    });
});
