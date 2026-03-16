import { userDataSchema } from 'fuesim-digital-shared';
import {
    createTestEnvironment,
    createTestUserSession,
    defaultTestUserSessionData,
} from '../test/utils.js';

describe('Auth-Service', () => {
    const environment = createTestEnvironment();

    describe('GET /api/auth/user-data', () => {
        it('returns correct user data for logged in user', async () => {
            const userSession = await createTestUserSession(environment);
            const response = await environment.httpRequest(
                'get',
                '/api/auth/user-data',
                userSession
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('expired', false);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toEqual(
                userDataSchema.parse(defaultTestUserSessionData)
            );
        });

        it('returns null for not logged in user', async () => {
            const response = await environment.httpRequest(
                'get',
                '/api/auth/user-data'
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user', null);
        });

        it('returns expired for old sessions', async () => {
            const userSession = await createTestUserSession(environment, {
                expired: true,
            });
            const response = await environment.httpRequest(
                'get',
                '/api/auth/user-data',
                userSession
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('expired', true);
            expect(response.body).toHaveProperty('user', null);
        });
    });
});
