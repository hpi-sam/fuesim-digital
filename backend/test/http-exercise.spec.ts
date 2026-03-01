import { exerciseKeysSchema } from 'fuesim-digital-shared';
import { UserReadableIdGenerator } from '../src/utils/user-readable-id-generator.js';
import { createExercise, createTestEnvironment } from './utils.js';

describe('exercise', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        UserReadableIdGenerator.freeAll();
        environment.exerciseService.TESTING_getExerciseMap().clear();
    });
    describe('POST /api/exercise', () => {
        it('returns an exercise key', async () => {
            const response = await environment
                .httpRequest('post', '/api/exercise')
                .expect(201);

            const exerciseCreationResponse = exerciseKeysSchema.parse(
                response.body
            );
            expect(exerciseCreationResponse.participantKey).toBeDefined();
            expect(exerciseCreationResponse.trainerKey).toBeDefined();
        });

        it('fails when no keys are left', async () => {
            for (let i = 0; i < 10_000; i++) {
                UserReadableIdGenerator.generateId();
            }
            await environment.httpRequest('post', '/api/exercise').expect(500);
        });
    });

    describe('GET /api/exercise/:exerciseKey', () => {
        it('succeeds with 200 with a valid participant key', async () => {
            const participantKey = (await createExercise(environment))
                .participantKey;
            await environment
                .httpRequest('get', `/api/exercise/${participantKey}`)
                .expect(200);
        });

        it('succeeds returning true for trainer key', async () => {
            const trainerKey = (await createExercise(environment)).trainerKey;
            await environment
                .httpRequest('get', `/api/exercise/${trainerKey}`)
                .expect(200);
        });

        it('fails with 400 for arbitrary keys', async () => {
            await Promise.all(
                ['12345', '1234567', '123456789'].map((invalidKey) =>
                    environment
                        .httpRequest('get', `/api/exercise/${invalidKey}`)
                        .expect(400)
                )
            );
        });

        it('fails with 404 for non-existing key', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/exercise/${UserReadableIdGenerator.generateId()}`
                )
                .expect(404);
        });
    });

    describe('DELETE /api/exercise/:exerciseKey', () => {
        it('succeeds deleting an exercise', async () => {
            const exerciseKey = (await createExercise(environment)).trainerKey;
            await environment
                .httpRequest('delete', `/api/exercise/${exerciseKey}`)
                .expect(204);

            expect(
                environment.exerciseService.TESTING_getExerciseMap().size
            ).toBe(0);
        });

        it('fails deleting an arbitrary exercise key string', async () => {
            await environment
                .httpRequest('delete', '/api/exercise/anyNumber')
                .expect(400);
        });

        it('fails deleting a not existing exercise', async () => {
            await environment
                .httpRequest('delete', '/api/exercise/12345678')
                .expect(404);
        });

        it('fails deleting an exercise by its participant key', async () => {
            const exerciseKey = (await createExercise(environment))
                .participantKey;
            await environment
                .httpRequest('delete', `/api/exercise/${exerciseKey}`)
                .expect(403);
        });

        it('disconnects clients of the removed exercise', async () => {
            const exerciseKey = (await createExercise(environment)).trainerKey;
            await environment.withWebsocket(async (socket) => {
                const joinExercise = await socket.emit(
                    'joinExercise',
                    exerciseKey,
                    ''
                );

                expect(joinExercise.success).toBe(true);

                socket.spyOn('disconnect');

                await environment
                    .httpRequest('delete', `/api/exercise/${exerciseKey}`)
                    .expect(204);

                expect(socket.getTimesCalled('disconnect')).toBe(1);
            });
        });
    });

    describe('GET /api/exercise/:exerciseKey/history', () => {
        it('returns history for existing exercise', async () => {
            const exerciseKey = (await createExercise(environment)).trainerKey;
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(200);
        });

        it('fails with 400 for abitrary exercise key string', async () => {
            const exerciseKey = 'non-existing-key';
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(400);
        });

        it('fails with 404 for non-existing exercise', async () => {
            const exerciseKey = UserReadableIdGenerator.generateId();
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(404);
        });
    });
});
