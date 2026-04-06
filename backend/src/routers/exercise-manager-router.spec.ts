import type { GetExerciseTemplateResponseData } from 'fuesim-digital-shared';
import {
    exerciseKeysSchema,
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
} from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createExercise,
    createTestUserSession,
    createTestEnvironment,
    createExerciseTemplate,
} from '../test/utils.js';

describe('exercise manager router', () => {
    const environment = createTestEnvironment();
    let session: string;
    beforeEach(async () => {
        await environment.repositories.accessKeyRepository.freeAll();
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
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
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/exercise_templates')
                .expect(403);
        });

        it('succeeds creating an exercise template', async () => {
            const beforeCreation = new Date();
            const testData = {
                name: 'Test Template',
                description: 'Great template!',
            };
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
        it('fails creating an exercise template with invalid data', async () => {
            const testData = {
                name: '',
            };
            await environment
                .httpRequest('post', '/api/exercise_templates', session)
                .send(testData)
                .expect(400);
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
                session
            );

            // Create other exercise template not to be shown for this user
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await createExerciseTemplate(environment, session2);

            const response = await environment
                .httpRequest('get', '/api/exercise_templates', session)
                .expect(200);
            const parsed = getExerciseTemplatesResponseDataSchema.parse(
                response.body
            );

            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.id).toBe(ownExerciseTemplate.id);
        });

        it('returns correct exercise template data', async () => {
            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session
            );

            const response = await environment
                .httpRequest('get', '/api/exercise_templates', session)
                .expect(200);
            const parsed = getExerciseTemplatesResponseDataSchema.parse(
                response.body
            )[0]!;

            expect(parsed).toMatchObject(exerciseTemplate);
        });
    });

    describe('PATCH /api/exercise_templates/:id', () => {
        let exerciseTemplate: GetExerciseTemplateResponseData;
        beforeEach(async () => {
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/exercise_templates/${exerciseTemplate.id}`
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
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    wrongSession
                )
                .send({ name: 'Other name' })
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
        let exerciseTemplate: GetExerciseTemplateResponseData;
        beforeEach(async () => {
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session
            );
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'delete',
                    `/api/exercise_templates/${exerciseTemplate.id}`
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
                    `/api/exercise_templates/${exerciseTemplate.id}`,
                    wrongSession
                )
                .expect(403);
        });

        it('succeeds deleting', async () => {
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
            expect(exerciseTemplateEntry).toBe(undefined);

            // Related exercise also has to be deleted
            expect(
                environment.services.exerciseService.TESTING_getExerciseMap()
                    .size
            ).toBe(0);
        });
    });

    describe('POST /api/exercise_templates/:id/new', () => {
        let exerciseTemplate: GetExerciseTemplateResponseData;
        beforeEach(async () => {
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session
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
    });
});
