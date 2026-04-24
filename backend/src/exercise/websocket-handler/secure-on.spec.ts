import { sleep } from 'fuesim-digital-shared';
import { createTestEnvironment } from '../../test/utils.js';

describe('secure on', () => {
    const environment = createTestEnvironment();
    it('does not crash in production environment when fed with invalid data', async () => {
        const originalEnv = process.env['NODE_ENV'];
        // Errors are only catched in production mode
        process.env['NODE_ENV'] = 'production';
        await environment
            .withWebsocket(async (socket) => {
                socket.insecureEmit('getState', 'any');
                // wait a bit so that the error can occur
                await sleep(1000);
                // Check whether the server is still available
                await environment.httpRequest('get', '/api/health').expect(200);
            })
            .finally(() => {
                process.env['NODE_ENV'] = originalEnv;
            });
    });
    // TODO: test that it does crash in development environment when fed with invalid data
});
