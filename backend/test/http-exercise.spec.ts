import { UserReadableIdGenerator } from '../src/utils/user-readable-id-generator.js';
import type { ExerciseCreationResponse } from './utils.js';
import { createExercise, createTestEnvironment } from './utils.js';

describe('exercise', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        UserReadableIdGenerator.freeAll();
        environment.exerciseService.TESTING_getExerciseMap().clear();
    });
    describe('POST /api/exercise', () => {
        it('returns an exercise id', async () => {
            const response = await environment
                .httpRequest('post', '/api/exercise')
                .expect(201);

            const exerciseCreationResponse =
                response.body as ExerciseCreationResponse;
            expect(exerciseCreationResponse.participantId).toBeDefined();
            expect(exerciseCreationResponse.trainerId).toBeDefined();
        });

        it('fails when no ids are left', async () => {
            for (let i = 0; i < 10_000; i++) {
                UserReadableIdGenerator.generateId();
            }
            await environment.httpRequest('post', '/api/exercise').expect(503);
        });
    });

    describe('GET /api/exercise/:exerciseId', () => {
        it('succeeds returning true for participant id', async () => {
            const participantId = (await createExercise(environment))
                .participantId;
            await environment
                .httpRequest('get', `/api/exercise/${participantId}`)
                .expect(200);
        });

        it('succeeds returning true for trainer id', async () => {
            const trainerId = (await createExercise(environment)).trainerId;
            await environment
                .httpRequest('get', `/api/exercise/${trainerId}`)
                .expect(200);
        });

        it('succeeds returning false for not existing id', async () => {
            await environment
                .httpRequest('get', `/api/exercise/trainerId`)
                .expect(404);
        });
    });

    describe('DELETE /api/exercise/:exerciseId', () => {
        it('succeeds deleting an exercise', async () => {
            const exerciseId = (await createExercise(environment)).trainerId;
            await environment
                .httpRequest('delete', `/api/exercise/${exerciseId}`)
                .expect(204);

            expect(
                environment.exerciseService.TESTING_getExerciseMap().size
            ).toBe(0);
        });

        it('fails deleting an arbitrary exercise id string', async () => {
            await environment
                .httpRequest('delete', '/api/exercise/anyNumber')
                .expect(500);
        });

        it('fails deleting a not existing exercise', async () => {
            await environment
                .httpRequest('delete', '/api/exercise/12345678')
                .expect(404);
        });

        it('fails deleting an exercise by its participant id', async () => {
            const exerciseId = (await createExercise(environment))
                .participantId;
            await environment
                .httpRequest('delete', `/api/exercise/${exerciseId}`)
                .expect(403);
        });

        it('disconnects clients of the removed exercise', async () => {
            const exerciseId = (await createExercise(environment)).trainerId;
            await environment.withWebsocket(async (socket) => {
                const joinExercise = await socket.emit(
                    'joinExercise',
                    exerciseId,
                    ''
                );

                expect(joinExercise.success).toBe(true);

                socket.spyOn('disconnect');

                await environment
                    .httpRequest('delete', `/api/exercise/${exerciseId}`)
                    .expect(204);

                expect(socket.getTimesCalled('disconnect')).toBe(1);
            });
        });
    });
});
