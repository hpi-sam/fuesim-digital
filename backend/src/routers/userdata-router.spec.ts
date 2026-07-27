import { getUserDataDumpDataSchema } from 'fuesim-digital-shared';
import { createTestUserSession, createTestEnvironment } from '../test/utils.js';

describe('userdata router', () => {
    const environment = createTestEnvironment();
    let session: string;
    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
    });
    describe('GET /api/userdata/dump', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', '/api/userdata/dump')
                .expect(403);
        });

        it('returns a validly shaped object if authenticated', async () => {
            const response = await environment
                .httpRequest('get', '/api/userdata/dump', session)
                .expect(200);

            expect(
                getUserDataDumpDataSchema.safeParse(response.body)
            ).toBeDefined();
        });
    });
});
