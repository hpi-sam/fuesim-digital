import { getUserDataDumpDataSchema } from 'fuesim-digital-shared';
import yauzl from 'yauzl';
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
                .responseType('blob')
                .expect(200);

            const zipfile = await yauzl.fromBufferPromise(response.body);

            let dataJsonExists = false;
            for await (const entry of zipfile.eachEntry()) {
                if (entry.fileName === 'data.json') {
                    dataJsonExists = true;

                    const readStream =
                        await zipfile.openReadStreamPromise(entry);
                    const chunks = [];
                    for await (const chunk of readStream) {
                        chunks.push(chunk);
                    }
                    const data = JSON.parse(
                        Buffer.concat(chunks).toString('utf8')
                    );

                    // fails if data are invalid
                    getUserDataDumpDataSchema.parse(data);
                }
            }
            expect(dataJsonExists).toBe(true);
        });
    });
});
