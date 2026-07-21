import {
    getExerciseResponseDataSchema,
    exerciseExistsResponseDataSchema,
    getExercisesResponseDataSchema,
} from 'fuesim-digital-shared';
import type {
    GetExerciseResponseData,
    GetExerciseTemplateWithTrainerKeyResponseData,
    OrganisationId,
    OrganisationMembershipRole,
    PostExerciseRequestData,
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
import { createOrganisation } from '../test/organisation-utils.js';

describe('exercise router', () => {
    const environment = createTestEnvironment();
    let session: string;
    let personalOrganisation: OrganisationEntry;

    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
        personalOrganisation =
            await environment.services.organisationService.ensurePersonalOrganisation(
                defaultTestUserSessionData
            );
    });

    describe('GET /api/exercises', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment.httpRequest('get', '/api/exercises').expect(403);
        });

        it('returns an empty list for no exercises', async () => {
            const response = await environment
                .httpRequest('get', '/api/exercises', session)
                .expect(200);

            const parsed = getExercisesResponseDataSchema.parse(response.body);
            expect(parsed).toEqual([]);
        });

        it('returns only own exercises', async () => {
            const ownExercise = await createExercise(
                environment,
                session,
                personalOrganisation.id
            );

            // Create other exercises not to be shown for this user
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const personalOrganisation2 =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    alternativeTestUserSessionData
                );
            await createExercise(
                environment,
                session2,
                personalOrganisation2.id
            );
            await createExercise(environment);

            const response = await environment
                .httpRequest('get', '/api/exercises', session)
                .expect(200);
            const parsed = getExercisesResponseDataSchema.parse(response.body);

            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.trainerKey).toBe(ownExercise.trainerKey);
        });

        it('returns correct data', async () => {
            const beforeCreation = new Date();
            const exercise = await createExercise(
                environment,
                session,
                personalOrganisation.id
            );

            const response = await environment
                .httpRequest('get', '/api/exercises', session)
                .expect(200);
            const parsed = getExercisesResponseDataSchema.parse(
                response.body
            )[0]!;

            expect(parsed.participantKey).toBe(exercise.participantKey);
            expect(parsed.trainerKey).toBe(exercise.trainerKey);
            expect(parsed.baseTemplate).toBe(null);
            expect(parsed.createdAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.createdAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.lastUsedAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.lastUsedAt.getTime()).toBeLessThan(Date.now());
        });

        it.each([
            'viewer',
            'editor',
            'admin',
        ] satisfies OrganisationMembershipRole[])(
            'succeeds with 200 if %s',
            async (role) => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                const organisation = await createOrganisation(
                    environment,
                    session2
                );
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    defaultTestUserSessionData.id,
                    role
                );

                const exercise = await createExercise(
                    environment,
                    session2,
                    organisation.id
                );

                const response = await environment
                    .httpRequest('get', '/api/exercises', session)
                    .expect(200);
                const parsed = getExercisesResponseDataSchema.parse(
                    response.body
                );

                expect(parsed).toHaveLength(1);
                expect(parsed[0]!.trainerKey).toBe(exercise.trainerKey);
            }
        );

        it('works with deleted base templates', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
            await environment
                .httpRequest(
                    'post',
                    `/api/exercise_templates/${exerciseTemplate.id}/new`,
                    session
                )
                .expect(201);
            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .expect(204);

            const response = await environment
                .httpRequest('get', '/api/exercises', session)
                .expect(200);
            const parsed = getExercisesResponseDataSchema.parse(
                response.body
            )[0]!;

            expect(parsed.baseTemplate).toBe(null);
        });
    });

    describe('GET /api/exercises/?organisationId=x', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/exercises/?organisationId=${personalOrganisation.id}`
                )
                .expect(403);
        });

        it('fails with 403 if not member of organisation', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const organisation = await createOrganisation(
                environment,
                session2
            );
            await environment
                .httpRequest(
                    'get',
                    `/api/exercises/?organisationId=${organisation.id}`,
                    session
                )
                .expect(403);
        });

        it('returns an empty list for no exercises', async () => {
            const response = await environment
                .httpRequest(
                    'get',
                    `/api/exercises/?organisationId=${personalOrganisation.id}`,
                    session
                )
                .expect(200);

            const parsed = getExercisesResponseDataSchema.parse(response.body);
            expect(parsed).toEqual([]);
        });

        it('returns only exercises from organisation', async () => {
            const ownExercise = await createExercise(
                environment,
                session,
                personalOrganisation.id
            );

            const otherOrganisation = await createOrganisation(
                environment,
                session
            );
            await createExercise(environment, session, otherOrganisation.id);
            await createExercise(environment);

            const response = await environment
                .httpRequest(
                    'get',
                    `/api/exercises/?organisationId=${personalOrganisation.id}`,
                    session
                )
                .expect(200);
            const parsed = getExercisesResponseDataSchema.parse(response.body);

            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.trainerKey).toBe(ownExercise.trainerKey);
        });

        it.each([
            'viewer',
            'editor',
            'admin',
        ] satisfies OrganisationMembershipRole[])(
            'succeeds with 200 if %s',
            async (role) => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                const organisation = await createOrganisation(
                    environment,
                    session2
                );
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    defaultTestUserSessionData.id,
                    role
                );
                const exercise = await createExercise(
                    environment,
                    session2,
                    organisation.id
                );
                await createExercise(
                    environment,
                    session,
                    personalOrganisation.id
                );
                await createExercise(environment);

                const response = await environment
                    .httpRequest(
                        'get',
                        `/api/exercises/?organisationId=${organisation.id}`,
                        session
                    )
                    .expect(200);

                const parsed = getExercisesResponseDataSchema.parse(
                    response.body
                );

                expect(parsed).toHaveLength(1);
                expect(parsed[0]!.trainerKey).toBe(exercise.trainerKey);
            }
        );
    });

    describe('POST /api/exercise', () => {
        it('succeeds creating anonymously', async () => {
            const response = await environment
                .httpRequest('post', '/api/exercise')
                .send({
                    importObject: null,
                    organisationId: null,
                } satisfies PostExerciseRequestData)
                .expect(201);

            const parsed = getExerciseResponseDataSchema.parse(response.body);
            expect(parsed.participantKey).toBeDefined();
            expect(parsed.trainerKey).toBeDefined();

            const exercise =
                (await environment.repositories.exerciseRepository.getExerciseById(
                    parsed.id
                ))!;
            expect(exercise.organisationId).toBe(null);
        });

        it('fails with 403 if not authenticated and organisation is set', async () => {
            await environment
                .httpRequest('post', '/api/exercise')
                .send({
                    importObject: null,
                    organisationId:
                        'd7d21361-848c-48b6-992b-c0e2ed7f46bd' as OrganisationId,
                } satisfies PostExerciseRequestData)
                .expect(403);
        });

        it('fails with 403 if not member of organisation', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const organisation = await createOrganisation(
                environment,
                session2
            );
            await environment
                .httpRequest('post', '/api/exercise', session)
                .send({
                    importObject: null,
                    organisationId: organisation.id,
                } satisfies PostExerciseRequestData)
                .expect(403);
        });

        it('fails with 403 if viewer of organisation', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const organisation = await createOrganisation(
                environment,
                session2
            );
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                defaultTestUserSessionData.id,
                'viewer'
            );

            await environment
                .httpRequest('post', '/api/exercise', session)
                .send({
                    importObject: null,
                    organisationId: organisation.id,
                } satisfies PostExerciseRequestData)
                .expect(403);
        });

        it('succeeds creating in personal organisation', async () => {
            const response = await environment
                .httpRequest('post', '/api/exercise', session)
                .send({
                    importObject: null,
                    organisationId: personalOrganisation.id,
                } satisfies PostExerciseRequestData)
                .expect(201);

            const parsed = getExerciseResponseDataSchema.parse(response.body);
            expect(parsed.participantKey).toBeDefined();
            expect(parsed.trainerKey).toBeDefined();

            const exercise =
                (await environment.repositories.exerciseRepository.getExerciseById(
                    parsed.id
                ))!;
            expect(exercise.organisationId).toBe(personalOrganisation.id);
        });

        it.each(['editor', 'admin'] satisfies OrganisationMembershipRole[])(
            'succeeds with 200 if %s',
            async (role) => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                const organisation = await createOrganisation(
                    environment,
                    session2
                );
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    defaultTestUserSessionData.id,
                    role
                );

                const response = await environment
                    .httpRequest('post', '/api/exercise', session)
                    .send({
                        importObject: null,
                        organisationId: organisation.id,
                    } satisfies PostExerciseRequestData)
                    .expect(201);

                const parsed = getExerciseResponseDataSchema.parse(
                    response.body
                );
                expect(parsed.participantKey).toBeDefined();
                expect(parsed.trainerKey).toBeDefined();

                const exercise =
                    (await environment.repositories.exerciseRepository.getExerciseById(
                        parsed.id
                    ))!;
                expect(exercise.organisationId).toBe(organisation.id);
            }
        );

        // TODO Test import
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

        it('fails for non-existing keys', async () => {
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

        describe('organisation-related exercise', () => {
            let exercise: GetExerciseResponseData;
            beforeEach(async () => {
                exercise = await createExercise(
                    environment,
                    session,
                    personalOrganisation.id
                );
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
            let exerciseTemplate: GetExerciseTemplateWithTrainerKeyResponseData;
            beforeEach(async () => {
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
                    `/api/exercise/${await environment.repositories.accessKeyRepository.generateKey(6)}`
                )
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(false);
        });
    });

    describe('GET /api/exercise/:exerciseKey/history', () => {
        it('succeeds with 200 with a valid participant key', async () => {
            const participantKey = (await createExercise(environment))
                .participantKey;
            await environment
                .httpRequest('get', `/api/exercise/${participantKey}/history`)
                .expect(200);
        });

        it('succeeds with 200 with a valid trainer key', async () => {
            const trainerKey = (await createExercise(environment)).trainerKey;
            await environment
                .httpRequest('get', `/api/exercise/${trainerKey}/history`)
                .expect(200);
        });

        it('fails for non-existing keys', async () => {
            await Promise.all(
                ['123456', '12345678'].map(async (invalidKey) => {
                    await environment
                        .httpRequest(
                            'get',
                            `/api/exercise/${invalidKey}/history`
                        )
                        .expect(404);
                })
            );
        });
        it('fails for arbitrary keys', async () => {
            await Promise.all(
                ['12345', '1234567', '123456789'].map((invalidKey) =>
                    environment
                        .httpRequest(
                            'get',
                            `/api/exercise/${invalidKey}/history`
                        )
                        .expect(400)
                )
            );
        });

        describe('user-related exercise', () => {
            let exercise: GetExerciseResponseData;
            beforeEach(async () => {
                exercise = await createExercise(
                    environment,
                    session,
                    personalOrganisation.id
                );
            });

            it('succeeds with 200 with a trainer key if not logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.trainerKey}/history`
                    )
                    .expect(200);
            });

            it('succeeds with 200 with a trainer key if logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.trainerKey}/history`,
                        session
                    )
                    .expect(200);
            });

            it('succeeds with 200 with a participant key if not logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}/history`
                    )
                    .expect(200);
            });

            it('succeeds with 200 with a participant key if logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exercise.participantKey}/history`,
                        session
                    )
                    .expect(200);
            });
        });

        describe('exercise template', () => {
            let exerciseTemplate: GetExerciseTemplateWithTrainerKeyResponseData;
            beforeEach(async () => {
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
                        `/api/exercise/${exerciseTemplate.trainerKey}/history`
                    )
                    .expect(403);
            });

            it('succeeds with trainer key if logged in', async () => {
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}/history`,
                        session
                    )
                    .expect(200);
            });

            it('fails with trainer key if logged in with wrong user', async () => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                await environment
                    .httpRequest(
                        'get',
                        `/api/exercise/${exerciseTemplate.trainerKey}/history`,
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
                        `/api/exercise/${exercise.participantKey}/history`
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
                        `/api/exercise/${exercise.participantKey}/history`,
                        session
                    )
                    .expect(403);
            });
        });

        it('fails for non-existing key', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/exercise/${await environment.repositories.accessKeyRepository.generateKey(6)}/history`
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

        describe('organisation-related exercise', () => {
            let exercise: GetExerciseResponseData;
            beforeEach(async () => {
                exercise = await createExercise(
                    environment,
                    session,
                    personalOrganisation.id
                );
            });

            it('fails with 403 if not authenticated', async () => {
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

            it('fails with 403 if wrong user', async () => {
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

            it('fails with 403 if not member of organisation', async () => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                const organisation = await createOrganisation(
                    environment,
                    session2
                );
                exercise = await createExercise(
                    environment,
                    session2,
                    organisation.id
                );

                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exercise.trainerKey}`,
                        session
                    )
                    .expect(403);
            });

            it('fails with 403 if viewer of organisation', async () => {
                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                const organisation = await createOrganisation(
                    environment,
                    session2
                );
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    defaultTestUserSessionData.id,
                    'viewer'
                );

                exercise = await createExercise(
                    environment,
                    session2,
                    organisation.id
                );

                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise/${exercise.trainerKey}`,
                        session
                    )
                    .expect(403);
            });

            it('succeeds if authenticated', async () => {
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

            it.each(['editor', 'admin'] satisfies OrganisationMembershipRole[])(
                'succeeds with 200 if %s',
                async (role) => {
                    const session2 = await createTestUserSession(environment, {
                        user: alternativeTestUserSessionData,
                    });
                    const organisation = await createOrganisation(
                        environment,
                        session2
                    );
                    await environment.repositories.organisationRepository.addMemberToOrganisation(
                        organisation.id,
                        defaultTestUserSessionData.id,
                        role
                    );

                    exercise = await createExercise(
                        environment,
                        session2,
                        organisation.id
                    );

                    await environment
                        .httpRequest(
                            'delete',
                            `/api/exercise/${exercise.trainerKey}`,
                            session
                        )
                        .expect(204);

                    const response = await environment
                        .httpRequest(
                            'get',
                            `/api/exercise/${exercise.trainerKey}`
                        )
                        .expect(200);
                    const parsed = exerciseExistsResponseDataSchema.parse(
                        response.body
                    );
                    expect(parsed.exists).toBe(false);
                }
            );
        });

        describe('exercise template', () => {
            let exerciseTemplate: GetExerciseTemplateWithTrainerKeyResponseData;
            beforeEach(async () => {
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
                const joinExercise = await socket.emit('joinExercise', {
                    exerciseKey,
                    clientName: '',
                });

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
                await environment.repositories.accessKeyRepository.generateKey(
                    6
                );
            await environment
                .httpRequest('get', `/api/exercise/${exerciseKey}/history`)
                .expect(404);
        });
    });
});
