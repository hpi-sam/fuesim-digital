import { createTestEnvironment } from '../test/utils.js';

describe('health', () => {
    const environment = createTestEnvironment();

    describe('GET /api/health', () => {
        it('is up', async () => {
            const response = await environment
                .httpRequest('get', '/api/health')
                .expect(200);

            const healthResponse = response.body as {
                status: string;
            };
            expect(healthResponse.status).toBeDefined();
        });
    });
});
