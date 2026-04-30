import {
    exerciseKeysSchema,
    exerciseExistsResponseDataSchema,
} from 'fuesim-digital-shared';
import type {
    GetExerciseTemplateResponseData,
    ExerciseKeys,
} from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createExerciseTemplate,
    createTestUserSession,
    createExercise,
    createTestEnvironment,
    defaultTestUserSessionData,
} from '../test/utils.js';
import type { OrganisationEntry } from '../database/schema.js';

describe('exercise router', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        await environment.repositories.accessKeyRepository.freeAll();
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
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
            await environment.services.accessKeyService.generateKeys(6, 10_000);
            await environment.httpRequest('post', '/api/exercise').expect(500);
        });
    });

    describe('GET /api/exercise/:exerciseKey', () => {
        it('succeeds with 200 with a valid participant key', async () => {
            const participantKey = (await createExercise(environment))
                .participantKey;
            const response = await environment
                .httpRequest('get', `/api/exercise/${participantKey}`)
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(true);
            expect(parsed.autojoin).toBe(false);
        });

        it('succeeds with 200 with a valid trainer key', async () => {
            const trainerKey = (await createExercise(environment)).trainerKey;
            const response = await environment
                .httpRequest('get', `/api/exercise/${trainerKey}`)
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(true);
            expect(parsed.autojoin).toBe(false);
        });

        it('fails  for non-existing keys', async () => {
            await Promise.all(
                ['123456', '12345678'].map(async (invalidKey) => {
                    const response = await environment
                        .httpRequest('get', `/api/exercise/${invalidKey}`)
                        .expect(200);
                    const parsed = exerciseExistsResponseDataSchema.parse(
                        response.body
                    );
                    expect(parsed.exists).toBe(false);
                })
            );
        });
        it('fails for arbitrary keys', async () => {
            await Promise.all(
                ['12345', '1234567', '123456789'].map((invalidKey) =>
                    environment
                        .httpRequest('get', `/api/exercise/${invalidKey}`)
                        .expect(400)
                )
            );
        });

        describe('user-related exercise', () => {
            let session: string;
            let exercise: ExerciseKeys;
            beforeEach(async () => {
                session = await createTestUserSession(environment);
                exercise = await createExercise(environment, session);
            });

            it('succeeds with 200 with a trainer key if not logged in', async () => {
                await environment
                    .httpRequest('get', `/api/exercise/${exercise.trainerKey}`)
                    .expect(200);
            });

            it('succeeds with 200 with a trainer key if logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.trainerKey}`,
                        session
                    )
                    .expect(200);
            });

            it('succeeds with 200 with a participant key if not logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}`
                    )
                    .expect(200);
            });

            it('succeeds with 200 with a participant key if logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}`,
                        session
                    )
                    .expect(200);
            });
        });

        describe('exercise template', () => {
            let session: string;
            let exerciseTemplate: GetExerciseTemplateResponseData;
            let personalOrganisation: OrganisationEntry;
            beforeEach(async () => {
                session = await createTestUserSession(environment);
                personalOrganisation =
                    await environment.services.organisationService.ensurePersonalOrganisation(
                        defaultTestUserSessionData
                    );
                exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session,
                    personalOrganisation.id
                );
            });

            it('fails with trainer key if not logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}`
                    )
                    .expect(403);
            });

            it('succeeds with trainer key if logged in', async () => {
                const response = await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}`,
                        session
                    )
                    .expect(200);

                const parsed = exerciseExistsResponseDataSchema.parse(
                    response.body
                );
                expect(parsed.exists).toBe(true);
                expect(parsed.autojoin).toBe(true);
            });

            it('fails with trainer key if logged in with wrong user', async () => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}`,
                        session2
                    )
                    .expect(403);
            });

            it('fails with participant key if not logged in', async () => {
                const exercise = environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(exerciseTemplate.trainerKey)!;
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}`
                    )
                    .expect(403);
            });

            it('fails with participant key if logged in', async () => {
                const exercise = environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(exerciseTemplate.trainerKey)!;
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}`,
                        session
                    )
                    .expect(403);
            });
        });

        it('fails for non-existing key', async () => {
            const response = await environment
                .httpRequest(
                    'get',
                    `/api/exercise/${await environment.services.accessKeyService.generateKey(6)}`
                )
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(false);
        });
    });

    describe('DELETE /api/exercise/:exerciseKey', () => {
        it('succeeds deleting an exercise', async () => {
            const exerciseKey = (await createExercise(environment)).trainerKey;
            await environment
                .httpRequest('delete', `/api/exercise/${exerciseKey}`)
                .expect(204);

            expect(
                environment.services.exerciseService.TESTING_getExerciseMap()
                    .size
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

        describe('user-related exercise', () => {
            let session: string;
            let exercise: ExerciseKeys;
            beforeEach(async () => {
                session = await createTestUserSession(environment);
                exercise = await createExercise(environment, session);
            });

            it('fails deleting an exercise if not logged-in', async () => {
                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exercise.trainerKey}`
                    )
                    .expect(403);

                await environment
                    .httpRequest('get', `/api/exercise/${exercise.trainerKey}`)
                    .expect(200);
            });

            it('fails deleting an exercise if logged-in with wrong user', async () => {
                session = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });

                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exercise.trainerKey}`
                    )
                    .expect(403);

                await environment
                    .httpRequest('get', `/api/exercise/${exercise.trainerKey}`)
                    .expect(200);
            });

            it('succeeds deleting an exercise if logged-in', async () => {
                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exercise.trainerKey}`,
                        session
                    )
                    .expect(204);

                const response = await environment
                    .httpRequest('get', `/api/exercise/${exercise.trainerKey}`)
                    .expect(200);
                const parsed = exerciseExistsResponseDataSchema.parse(
                    response.body
                );
                expect(parsed.exists).toBe(false);
            });
        });

        describe('exercise template', () => {
            let session: string;
            let exerciseTemplate: GetExerciseTemplateResponseData;
            let personalOrganisation: OrganisationEntry;
            beforeEach(async () => {
                session = await createTestUserSession(environment);
                personalOrganisation =
                    await environment.services.organisationService.ensurePersonalOrganisation(
                        defaultTestUserSessionData
                    );
                exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session,
                    personalOrganisation.id
                );
            });

            it('fails deleting an exercise being a template if logged-in', async () => {
                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exerciseTemplate.trainerKey}`,
                        session
                    )
                    .expect(403);

                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}`,
                        session
                    )
                    .expect(200);
            });
            it('fails deleting an exercise being a template if not logged-in', async () => {
                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exerciseTemplate.trainerKey}`
                    )
                    .expect(403);

                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}`,
                        session
                    )
                    .expect(200);
            });
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

        it('fails with 400 for arbitrary exercise key string', async () => {
            const exerciseKey = 'non-existing-key';
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(400);
        });

        it('fails with 404 for non-existing exercise', async () => {
            const exerciseKey =
                await environment.services.accessKeyService.generateKey(6);
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(404);
        });
    });
});
