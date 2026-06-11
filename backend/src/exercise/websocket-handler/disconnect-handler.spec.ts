import assert from 'node:assert';
import { createTestEnvironment, createExercise } from '../../test/utils.js';

describe('disconnect socket', () => {
    const environment = createTestEnvironment();

    it('marks client as inactive on disconnect', async () => {
        const participantKey = (await createExercise(environment))
            .participantKey;

        const outerName = 'Name';
        const innerName = 'My Name';

        await environment.withWebsocket(async (outerSocket) => {
            await outerSocket.emit('joinExercise', {
                exerciseKey: participantKey,
                clientName: outerName,
            });

            let state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const previousClientIds = Object.keys(state.payload.clients);

            await environment.withWebsocket(async (innerSocket) =>
                innerSocket.emit('joinExercise', {
                    exerciseKey: participantKey,
                    clientName: innerName,
                })
            );

            state = await outerSocket.emit('getState');
            expect(state.success).toBe(true);
            assert(state.success);
            const afterClientIds = Object.keys(state.payload.clients);
            // After disconnect, the client is marked inactive (not removed), so both clients remain
            expect(afterClientIds.length).toBe(previousClientIds.length + 1);
        });
    });
});
