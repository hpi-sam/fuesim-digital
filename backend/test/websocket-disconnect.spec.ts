import assert from 'node:assert';
import { createTestEnvironment, createExercise } from './utils.js';

describe('disconnect socket', () => {
    const environment = createTestEnvironment();

    it('removes client from state on disconnect', async () => {
        const exerciseId = (await createExercise(environment)).participantId;

        const outerName = 'Name';
        const innerName = 'My Name';

        await environment.withWebsocket(async (outerSocket) => {
            await outerSocket.emit('joinExercise', exerciseId, outerName);

            let state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const previousClientIds = Object.keys(state.payload.clients);

            await environment.withWebsocket(async (innerSocket) =>
                innerSocket.emit('joinExercise', exerciseId, innerName)
            );

            state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const afterClientIds = Object.keys(state.payload.clients);
            expect(afterClientIds).toStrictEqual(previousClientIds);
        });
    });
});
