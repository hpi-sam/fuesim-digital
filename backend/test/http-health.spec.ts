import { createTestEnvironment } from './utils.js';

describe('health', () => {
    const environment = createTestEnvironment();

    describe('GET /api/health', () => {
        it('is up', async () => {
            const response = await environment
                .httpRequest('get', '/api/health')
                .expect(200);

            const exerciseCreationResponse = response.body as {
                status: string;
            };
            expect(exerciseCreationResponse.status).toBeDefined();
        });
    });
});
