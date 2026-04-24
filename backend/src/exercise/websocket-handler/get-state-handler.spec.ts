import { createTestEnvironment } from '../../test/utils.js';

describe('get state', () => {
    const environment = createTestEnvironment();

    it('fails getting the state when not joined an exercise', async () => {
        await environment.withWebsocket(async (socket) => {
            const getState = await socket.emit('getState');

            expect(getState.success).toBe(false);
        });
    });
});
