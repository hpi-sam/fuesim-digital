import assert from 'node:assert';
import { createTestEnvironment, createExercise } from '../../test/utils.js';

describe('disconnect socket', () => {
    const environment = createTestEnvironment();

    it('removes client from state on disconnect', async () => {
        const participantKey = (await createExercise(environment))
            .participantKey;

        const outerName = 'Name';
        const innerName = 'My Name';

        await environment.withWebsocket(async (outerSocket) => {
            await outerSocket.emit('joinExercise', participantKey, outerName);

            let state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const previousClientIds = Object.keys(state.payload.clients);

            await environment.withWebsocket(async (innerSocket) =>
                innerSocket.emit('joinExercise', participantKey, innerName)
            );

            state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const afterClientIds = Object.keys(state.payload.clients);
            expect(afterClientIds).toStrictEqual(previousClientIds);
        });
    });
});
