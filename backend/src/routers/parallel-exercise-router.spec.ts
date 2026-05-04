import type {
    PostParallelExerciseRequestData,
    GetParallelExerciseResponseData,
    ExerciseState,
    SetAutojoinViewportAction,
} from 'fuesim-digital-shared';
import {
    exerciseExistsResponseDataSchema,
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    postJoinParallelExerciseResponseDataSchema,
    uuid,
} from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createTestUserSession,
    createTestEnvironment,
    createExerciseTemplate,
    defaultTestUserSessionData,
} from '../test/utils.js';
import {
    createParallelExercise,
    createViewport,
    joinParallelExercise,
} from '../test/parallel-exercise-utils.js';
import type { OrganisationEntry } from '../database/schema.js';

describe('parallel exercise router', () => {
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
    describe('GET /api/parallel_exercises', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', '/api/parallel_exercises')
                .expect(403);
        });

        it('returns an empty list for no parallel exercises', async () => {
            const response = await environment
                .httpRequest('get', '/api/parallel_exercises', session)
                .expect(200);

            const parsed = getParallelExercisesResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toEqual([]);
        });

        it('returns only own parallel exercises', async () => {
            const ownExercise = await createParallelExercise(
                environment,
                session
            );

            // Create other exercises not to be shown for this user
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await createParallelExercise(environment, session2);

            const response = await environment
                .httpRequest('get', '/api/parallel_exercises', session)
                .expect(200);
            const parsed = getParallelExercisesResponseDataSchema.parse(
                response.body
            );

            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.id).toBe(ownExercise.id);
        });

        it('returns correct data', async () => {
            const exercise = await createParallelExercise(environment, session);

            const response = await environment
                .httpRequest('get', '/api/parallel_exercises', session)
                .expect(200);
            const parsed = getParallelExercisesResponseDataSchema.parse(
                response.body
            )[0]!;

            expect(parsed).toMatchObject(exercise);
        });
    });

    describe('GET /api/parallel_exercises/:id', () => {
        let parallelExercise: GetParallelExerciseResponseData;
        beforeEach(async () => {
            parallelExercise = await createParallelExercise(
                environment,
                session
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/parallel_exercises/${parallelExercise.id}`
                )
                .expect(403);
        });

        it('fails with wrong id', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/parallel_exercises/${uuid()}`,
                    session
                )
                .expect(404);
        });

        it('fails with wrong user', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'get',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    session2
                )
                .expect(403);
        });

        it('returns own parallel exercises', async () => {
            const response = await environment
                .httpRequest(
                    'get',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    session
                )
                .expect(200);
            const parsed = getParallelExerciseResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toMatchObject(parallelExercise);
        });
    });

    describe('POST /api/parallel_exercises', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/parallel_exercises')
                .expect(403);
        });

        it('succeeds creating a parallel exercise', async () => {
            const beforeCreation = new Date();
            const template = await createExerciseTemplate(
                environment,
                session,
                personalOrganisation.id
            );

            const exerciseId =
                (await environment.repositories.exerciseRepository.getExerciseTemplateById(
                    template.id
                ))!.exercise.id;

            const viewport = createViewport(
                environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(exerciseId)!
            );
            const testData = {
                name: 'Test Parallel Exercise',
                templateId: template.id,
                joinViewportId: viewport.id,
            } satisfies PostParallelExerciseRequestData;
            const response = await environment
                .httpRequest('post', '/api/parallel_exercises', session)
                .send(testData)
                .expect(201);

            const parsed = getParallelExerciseResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toEqual(testData.name);
            expect(parsed.createdAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.createdAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.joinViewportId).toBe(testData.joinViewportId);
            expect(parsed.template.id).toBe(testData.templateId);
        });
        it('fails creating a parallel exercise with invalid data', async () => {
            const testData = {
                name: '',
            };
            await environment
                .httpRequest('post', '/api/parallel_exercises', session)
                .send(testData)
                .expect(400);
        });
    });

    describe('PATCH /api/parallel_exercises/:id', () => {
        let parallelExercise: GetParallelExerciseResponseData;
        beforeEach(async () => {
            parallelExercise = await createParallelExercise(
                environment,
                session
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/parallel_exercises/${parallelExercise.id}`
                )
                .send({ name: 'Other name' })
                .expect(403);
        });

        it('fails with 403 if wrong user', async () => {
            const wrongSession = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'patch',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    wrongSession
                )
                .send({ name: 'Other name' })
                .expect(403);
        });

        it('fails with 400 if wrong data', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    session
                )
                .send({ name: '' })
                .expect(400);
        });

        it('succeeds updating', async () => {
            const newData = { name: 'Other name' };
            await environment
                .httpRequest(
                    'patch',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    session
                )
                .send(newData)
                .expect(200);
            const parallelExerciseEntry =
                (await environment.repositories.parallelExerciseRepository.getParallelExerciseById(
                    parallelExercise.id
                ))!;
            expect(parallelExerciseEntry.name).toBe(newData.name);
        });
    });

    describe('DELETE /api/parallel_exercises/:id', () => {
        let parallelExercise: GetParallelExerciseResponseData;
        beforeEach(async () => {
            parallelExercise = await createParallelExercise(
                environment,
                session
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'delete',
                    `/api/parallel_exercises/${parallelExercise.id}`
                )
                .expect(403);
        });

        it('fails with 403 if wrong user', async () => {
            const wrongSession = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'delete',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    wrongSession
                )
                .expect(403);
        });

        it('succeeds deleting', async () => {
            await joinParallelExercise(environment, parallelExercise);
            expect(
                environment.services.exerciseService.TESTING_getExerciseMap()
                    .size
            ).toBe(6);

            await environment
                .httpRequest(
                    'delete',
                    `/api/parallel_exercises/${parallelExercise.id}`,
                    session
                )
                .expect(204);

            const parallelExerciseEntry =
                await environment.repositories.parallelExerciseRepository.getParallelExerciseById(
                    parallelExercise.id
                );
            expect(parallelExerciseEntry).toBe(null);

            // Related exercises also have to be deleted
            // only the exercise template is still there
            expect(
                environment.services.exerciseService.TESTING_getExerciseMap()
                    .size
            ).toBe(3);
        });
    });

    describe('GET /api/parallel_exercises/join/:key', () => {
        it('succeeds with 200 with a valid participant key', async () => {
            const parallelExercise = await createParallelExercise(
                environment,
                session
            );
            const response = await environment
                .httpRequest(
                    'get',
                    `/api/parallel_exercises/join/${parallelExercise.participantKey}`
                )
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(true);
        });

        it('fails for non-existing keys', async () => {
            const response = await environment
                .httpRequest('get', `/api/parallel_exercises/join/1234567`)
                .expect(200);
            const parsed = exerciseExistsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.exists).toBe(false);
        });

        it('fails for arbitrary keys', async () => {
            await Promise.all(
                ['12345', '123456', '12345678'].map((invalidKey) =>
                    environment
                        .httpRequest(
                            'get',
                            `/api/parallel_exercises/join/${invalidKey}`
                        )
                        .expect(400)
                )
            );
        });
    });

    describe('POST /api/parallel_exercises/join/:key', () => {
        let parallelExercise: GetParallelExerciseResponseData;
        beforeEach(async () => {
            parallelExercise = await createParallelExercise(
                environment,
                session
            );
        });

        it('fails joining with invalid key', async () => {
            const invalidKey =
                await environment.services.accessKeyService.generateKey(7);
            await environment
                .httpRequest(
                    'post',
                    `/api/parallel_exercises/join/${invalidKey}`
                )
                .expect(404);
        });

        it('succeeds joining with correct key', async () => {
            const templateExercise = environment.services.exerciseService
                .TESTING_getExerciseMap()
                .values()
                .next().value!;
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/parallel_exercises/join/${parallelExercise.participantKey}`
                )
                .expect(201);
            const parsed = postJoinParallelExerciseResponseDataSchema.parse(
                response.body
            );
            const newExercise = environment.services.exerciseService
                .TESTING_getExerciseMap()
                .get(parsed.participantKey)!;

            expect(newExercise.participantKey).not.toBe(
                parallelExercise.participantKey
            );

            const expectedState: ExerciseState = {
                ...templateExercise.exercise.currentStateString,
                type: 'parallel',
                participantKey: parsed.participantKey,
            };

            expect(newExercise.exercise.initialStateString).toMatchObject(
                expectedState
            );
            expect(newExercise.exercise.currentStateString).toMatchObject({
                ...expectedState,
                autojoinViewportId: parallelExercise.joinViewportId,
            });

            const action: SetAutojoinViewportAction = {
                type: '[Exercise] Set autojoin viewport',
                viewportId: parallelExercise.joinViewportId,
            };
            expect(newExercise.temporaryActionHistory).toHaveLength(1);
            expect(
                newExercise.temporaryActionHistory[0]!.getAction().actionString
            ).toMatchObject(action);
        });
    });
});
