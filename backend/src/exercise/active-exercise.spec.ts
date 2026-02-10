import { jest } from '@jest/globals';
import type {
    ExerciseKey,
    ParticipantKey,
    TrainerKey,
} from 'digital-fuesim-manv-shared';
import { sleep } from 'digital-fuesim-manv-shared';
import { createTestEnvironment } from '../../test/utils.js';
import { clientMap } from './client-map.js';
import { ActiveExercise } from './active-exercise.js';

describe('Active Exercise', () => {
    const environment = createTestEnvironment();

    it('fails getting a role for the wrong key', () => {
        const exercise = new ActiveExercise(
            '123456' as ParticipantKey,
            '12345678' as TrainerKey
        );

        expect(() =>
            exercise.getRoleFromUsedKey('wrong key' as ExerciseKey)
        ).toThrow(RangeError);
    });

    it('does nothing adding a client that is not set up', async () => {
        const exercise = new ActiveExercise(
            '123456' as ParticipantKey,
            '12345678' as TrainerKey
        );
        // Use a websocket in order to have a ClientWrapper set up
        await environment.withWebsocket(async () => {
            // Sleep a bit to allow the socket to connect.
            await sleep(100);
            const client = clientMap.values().next().value;
            expect(client).toBeDefined();

            const applySpy = jest.spyOn(
                ActiveExercise.prototype,
                'applyAction'
            );
            exercise.addClient(client!);

            expect(applySpy).not.toHaveBeenCalled();
        });
    });

    it('does nothing removing a client that is not joined', async () => {
        const exercise = new ActiveExercise(
            '123456' as ParticipantKey,
            '12345678' as TrainerKey
        );
        // Use a websocket in order to have a ClientWrapper set up
        await environment.withWebsocket(async () => {
            // Sleep a bit to allow the socket to connect.
            await sleep(100);
            const client = clientMap.values().next().value;
            expect(client).toBeDefined();

            const applySpy = jest.spyOn(
                ActiveExercise.prototype,
                'applyAction'
            );
            applySpy.mockClear();
            exercise.removeClient(client!);

            expect(applySpy).not.toHaveBeenCalled();
        });
    });

    describe('Started Exercise', () => {
        let exercise: ActiveExercise | undefined;
        beforeEach(() => {
            exercise = new ActiveExercise(
                '123456' as ParticipantKey,
                '12345678' as TrainerKey
            );
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
        it('calls start when matching action is sent', () => {
            const exercise = new ActiveExercise(
                '123456' as ParticipantKey,
                '12345678' as TrainerKey
            );

            const startMock = jest.spyOn(ActiveExercise.prototype, 'start');
            startMock.mockImplementation(() => ({}));

            exercise.applyAction(
                { type: '[Exercise] Start' },
                (exercise as any).emitterUUID
            );
            expect(startMock).toHaveBeenCalledTimes(1);
        });

        it('calls pause when matching action is sent', () => {
            const exercise = new ActiveExercise(
                '123456' as ParticipantKey,
                '12345678' as TrainerKey
            );

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
