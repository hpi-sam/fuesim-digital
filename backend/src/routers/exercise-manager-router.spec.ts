import type {
    GetExerciseTemplateResponseData,
    OrganisationMembershipRole,
    PatchExerciseTemplateRequestData,
    PostExerciseTemplateRequestData,
} from 'fuesim-digital-shared';
import {
    exerciseKeysSchema,
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
    newViewport,
    StateExport,
} from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createExercise,
    createTestUserSession,
    createTestEnvironment,
    createExerciseTemplate,
    defaultTestUserSessionData,
} from '../test/utils.js';
import type { OrganisationEntry } from '../database/schema.js';
import type { ExerciseTemplateDetailsEntry } from '../database/repositories/exercise-repository.js';
import { createOrganisation } from '../test/organisation-utils.js';

describe('exercise manager router', () => {
    const environment = createTestEnvironment();
    let session: string;
    let personalOrganisation: OrganisationEntry;
    beforeEach(async () => {
        await environment.repositories.accessKeyRepository.freeAll();
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
            const ownExercise = await createExercise(environment, session);

            // Create other exercises not to be shown for this user
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await createExercise(environment, session2);
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
            const exercise = await createExercise(environment, session);

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
    });
    describe('POST /api/exercise_templates', () => {
        let testData: PostExerciseTemplateRequestData;
        beforeEach(async () => {
            testData = {
                name: 'Test Template',
                description: 'Great template!',
                organisationId: personalOrganisation.id,
                importObject: undefined,
            };
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/exercise_templates')
                .send(testData)
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
                .httpRequest('post', '/api/exercise_templates', session)
                .send({
                    ...testData,
                    organisationId: organisation.id,
                } satisfies PostExerciseTemplateRequestData)
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
                .httpRequest('post', '/api/exercise_templates', session)
                .send({
                    ...testData,
                    organisationId: organisation.id,
                } satisfies PostExerciseTemplateRequestData)
                .expect(403);
        });

        it('succeeds creating an exercise template', async () => {
            const beforeCreation = new Date();

            const response = await environment
                .httpRequest('post', '/api/exercise_templates', session)
                .send(testData)
                .expect(201);

            const parsed = getExerciseTemplateResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toEqual(testData.name);
            expect(parsed.description).toEqual(testData.description);
            expect(parsed.createdAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.createdAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.lastUpdatedAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.lastUpdatedAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.lastExerciseCreatedAt).toBe(null);
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
                    .httpRequest('post', '/api/exercise_templates', session)
                    .send({
                        ...testData,
                        organisationId: organisation.id,
                    } satisfies PostExerciseTemplateRequestData)
                    .expect(201);

                const parsed = getExerciseTemplateResponseDataSchema.parse(
                    response.body
                );
                expect(parsed.name).toEqual(testData.name);

                const exerciseTemplate =
                    (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                        parsed.id
                    ))!;
                expect(exerciseTemplate.organisationId).toBe(organisation.id);
            }
        );

        it('fails creating an exercise template with invalid data', async () => {
            const invalidTestData = {
                name: '',
            };
            await environment
                .httpRequest('post', '/api/exercise_templates', session)
                .send(invalidTestData)
                .expect(400);
        });
    });

    describe('POST /api/exercise_templates/import', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/exercise_templates/import')
                .expect(403);
        });

        it('succeeds creating an exercise template', async () => {
            const beforeCreation = new Date();
            const exercise =
                await environment.services.exerciseService.createExerciseFromBlank();
            exercise.applyAction(
                {
                    type: '[Viewport] Add viewport',
                    viewport: newViewport(
                        {
                            x: 0,
                            y: 0,
                        },
                        ''
                    ),
                },
                null
            );

            const exportData = new StateExport(
                exercise.exercise.currentStateString
            );
            const response = await environment
                .httpRequest('post', '/api/exercise_templates/', session)
                .send({
                    importObject: exportData,
                    name: 'Importierte Datei',
                    description: '',
                    organisationId: personalOrganisation.id,
                } satisfies PostExerciseTemplateRequestData)
                .expect(201);

            const parsed = getExerciseTemplateResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toEqual('Importierte Datei');
            expect(parsed.description).toEqual('');
            expect(parsed.createdAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.createdAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.lastUpdatedAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.lastUpdatedAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.lastExerciseCreatedAt).toBe(null);

            const exerciseId =
                (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    parsed.id
                ))!.exercise.id;
            const importedExercise = environment.services.exerciseService
                .TESTING_getExerciseMap()
                .get(exerciseId)!;
            expect(importedExercise.exercise.currentStateString).toMatchObject({
                ...exercise.exercise.currentStateString,
                participantKey: importedExercise.participantKey,
            });
        });
    });

    describe('GET /api/exercise_templates', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', '/api/exercise_templates')
                .expect(403);
        });

        it('returns an empty list for no exercise templates', async () => {
            const response = await environment
                .httpRequest('get', '/api/exercise_templates', session)
                .expect(200);

            const parsed = getExerciseTemplatesResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toEqual([]);
        });

        it('returns only own exercise templates', async () => {
            const ownExerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );

            // Create other exercise template not to be shown for this user
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const personalOrganisation2 =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    alternativeTestUserSessionData
                );
            await createExerciseTemplate(
                environment,
                session2,
                personalOrganisation2.id
            );

            const response = await environment
                .httpRequest('get', '/api/exercise_templates', session)
                .expect(200);
            const parsed = getExerciseTemplatesResponseDataSchema.parse(
                response.body
            );

            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.id).toBe(ownExerciseTemplate.id);
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

                const exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session2,
                    organisation.id
                );

                const response = await environment
                    .httpRequest('get', '/api/exercise_templates', session)
                    .expect(200);
                const parsed = getExerciseTemplatesResponseDataSchema.parse(
                    response.body
                );

                expect(parsed).toHaveLength(1);
                expect(parsed[0]!.id).toBe(exerciseTemplate.id);
            }
        );

        it('returns correct exercise template data', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );

            const response = await environment
                .httpRequest('get', '/api/exercise_templates', session)
                .expect(200);
            const parsed = getExerciseTemplatesResponseDataSchema.parse(
                response.body
            )[0]!;

            expect(parsed.id).toBe(exerciseTemplate.id);
            expect(parsed.name).toBe(exerciseTemplate.name);
            expect(parsed.description).toBe(exerciseTemplate.description);
        });
    });

    describe('PATCH /api/exercise_templates/:id', () => {
        let exerciseTemplate: GetExerciseTemplateResponseData;
        beforeEach(async () => {
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`
                )
                .send({
                    name: 'Other name',
                } satisfies PatchExerciseTemplateRequestData)
                .expect(403);
        });

        it('fails with 403 if wrong user', async () => {
            const wrongSession = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    wrongSession
                )
                .send({
                    name: 'Other name',
                } satisfies PatchExerciseTemplateRequestData)
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
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session2,
                organisation.id
            );

            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .send({
                    name: 'Other name',
                } satisfies PatchExerciseTemplateRequestData)
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

            exerciseTemplate = await createExerciseTemplate(
                environment,
                session2,
                organisation.id
            );

            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .send({
                    name: 'Other name',
                } satisfies PatchExerciseTemplateRequestData)
                .expect(403);
        });

        it('succeeds updating', async () => {
            const beforeUpdate = Date.now();
            const newData = { name: 'Other name', description: 'Other name' };
            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .send(newData)
                .expect(200);
            const exerciseTemplateEntry =
                (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    exerciseTemplate.id
                ))!;
            expect(exerciseTemplateEntry.name).toBe(newData.name);
            expect(exerciseTemplateEntry.description).toBe(newData.description);
            expect(
                exerciseTemplateEntry.lastUpdatedAt.getTime()
            ).toBeGreaterThan(beforeUpdate);
            expect(exerciseTemplateEntry.lastUpdatedAt.getTime()).toBeLessThan(
                Date.now()
            );
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

                exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session2,
                    organisation.id
                );

                await environment
                    .httpRequest(
                        'patch',
                        `/api/exercise_templates/${exerciseTemplate.id}`,
                        session
                    )
                    .send({
                        name: 'Other name',
                    } satisfies PatchExerciseTemplateRequestData)
                    .expect(200);

                const exerciseTemplateEntry =
                    (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                        exerciseTemplate.id
                    ))!;
                expect(exerciseTemplateEntry.name).toBe('Other name');
            }
        );

        it('succeeds partial updating', async () => {
            const newData = { name: 'Other name' };
            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .send(newData)
                .expect(200);
            const exerciseTemplateEntry =
                (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    exerciseTemplate.id
                ))!;
            expect(exerciseTemplateEntry.name).toBe(newData.name);
            expect(exerciseTemplateEntry.description).toBe(
                exerciseTemplate.description
            );
        });
    });

    describe('DELETE /api/exercise_templates/:id', () => {
        it('fails with 403 if not authenticated', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`
                )
                .expect(403);
        });

        it('fails with 403 if wrong user', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
            const wrongSession = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    wrongSession
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
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session2,
                organisation.id
            );

            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
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

            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session2,
                organisation.id
            );

            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .expect(403);
        });

        it('succeeds deleting', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    session
                )
                .expect(204);

            const exerciseTemplateEntry =
                await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    exerciseTemplate.id
                );
            expect(exerciseTemplateEntry).toBe(null);

            // Related exercise also has to be deleted
            expect(
                environment.services.exerciseService.TESTING_getExerciseMap()
                    .size
            ).toBe(0);
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

                const exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session2,
                    organisation.id
                );

                await environment
                    .httpRequest(
                        'delete',
                        `/api/exercise_templates/${exerciseTemplate.id}`,
                        session
                    )
                    .expect(204);

                const exerciseTemplateEntry =
                    await environment.repositories.exerciseRepository.getExerciseTemplateById(
                        exerciseTemplate.id
                    );
                expect(exerciseTemplateEntry).toBe(null);

                // Related exercise also has to be deleted
                expect(
                    environment.services.exerciseService.TESTING_getExerciseMap()
                        .size
                ).toBe(0);
            }
        );
    });

    describe('POST /api/exercise_templates/:id/new', () => {
        let exerciseTemplate: ExerciseTemplateDetailsEntry;
        beforeEach(async () => {
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/exercise_templates/${exerciseTemplate.id}/new`
                )
                .expect(403);
        });

        it('fails with 403 if wrong user', async () => {
            const wrongSession = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'post',
                    `/api/exercise_templates/${exerciseTemplate.id}/new`,
                    wrongSession
                )
                .expect(403);
        });

        it('succeeds creating a new exercise', async () => {
            const beforeCreation = Date.now();
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/exercise_templates/${exerciseTemplate.id}/new`,
                    session
                )
                .expect(201);
            const parsed = exerciseKeysSchema.parse(response.body);

            // Ensure different trainer key
            expect(parsed.trainerKey).not.toBe(
                exerciseTemplate.exercise.trainerKey
            );

            // Ensure existence of exercise
            await environment
                .httpRequest('get', `/api/exercise/${parsed.trainerKey}`)
                .expect(200);

            // Ensure correctness of exercises list
            const responseExercise = await environment
                .httpRequest('get', '/api/exercises', session)
                .expect(200);
            const parsedExerciseMeta = getExercisesResponseDataSchema.parse(
                responseExercise.body
            )[0]!;
            expect(parsedExerciseMeta.baseTemplate?.id).toBe(
                exerciseTemplate.id
            );
            expect(parsedExerciseMeta.baseTemplate?.name).toBe(
                exerciseTemplate.name
            );

            // Ensure that lastExerciseCreatedAt has been updated
            const exerciseTemplateEntry =
                (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    exerciseTemplate.id
                ))!;
            expect(
                exerciseTemplateEntry.lastExerciseCreatedAt!.getTime()
            ).toBeGreaterThan(beforeCreation);
            expect(
                exerciseTemplateEntry.lastExerciseCreatedAt!.getTime()
            ).toBeLessThan(Date.now());
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

                exerciseTemplate = await createExerciseTemplate(
                    environment,
                    session2,
                    organisation.id
                );

                const response = await environment
                    .httpRequest(
                        'post',
                        `/api/exercise_templates/${exerciseTemplate.id}/new`,
                        session
                    )
                    .expect(201);
                const parsed = exerciseKeysSchema.parse(response.body);

                // Ensure different trainer key
                expect(parsed.trainerKey).not.toBe(
                    exerciseTemplate.exercise.trainerKey
                );

                // Ensure existence of exercise
                await environment
                    .httpRequest('get', `/api/exercise/${parsed.trainerKey}`)
                    .expect(200);
            }
        );
    });
});
