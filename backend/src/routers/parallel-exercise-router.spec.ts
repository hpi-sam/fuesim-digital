import type {
    GetExerciseTemplateResponseData,
    PostParallelExerciseRequestData,
    AddViewportAction,
    GetParallelExerciseResponseData,
} from 'fuesim-digital-shared';
import {
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    Viewport,
} from 'fuesim-digital-shared';
import type { TestEnvironment } from '../test/utils.js';
import {
    alternativeTestUserSessionData,
    createTestUserSession,
    createTestEnvironment,
    createExerciseTemplate,
} from '../test/utils.js';
import type { ActiveExercise } from '../exercise/active-exercise.js';

function createViewport(exercise: ActiveExercise): Viewport {
    const addViewportAction: AddViewportAction = {
        type: '[Viewport] Add viewport',
        viewport: Viewport.create(
            {
                x: 0,
                y: 0,
            },
            {
                height: 1,
                width: 1,
            },
            ''
        ),
    };
    exercise.applyAction(addViewportAction, null);
    return Object.values(exercise.exercise.currentStateString.viewports)[0]!;
}

async function createParallelExercise(
    environment: TestEnvironment,
    session: string,
    template?: GetExerciseTemplateResponseData
) {
    template ??= await createExerciseTemplate(environment, session);

    const viewport = createViewport(
        environment.services.exerciseService
            .TESTING_getExerciseMap()
            .get(template.trainerKey)!
    );
    const response = await environment
        .httpRequest('post', '/api/parallel_exercises/', session)
        .send({
            name: 'Test Parallel Exercise',
            templateId: template.id,
            joinViewportId: viewport.id,
        } satisfies PostParallelExerciseRequestData)
        .expect(201);

    return getParallelExerciseResponseDataSchema.parse(response.body);
}

describe('parallel exercise router', () => {
    const environment = createTestEnvironment();
    let session: string;
    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
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
    describe('POST /api/parallel_exercises', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/parallel_exercises')
                .expect(403);
        });

        it('succeeds creating a parallel exercise', async () => {
            const beforeCreation = new Date();
            const template = await createExerciseTemplate(environment, session);

            const viewport = createViewport(
                environment.services.exerciseService
                    .TESTING_getExerciseMap()
                    .get(template.trainerKey)!
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
            // TODO Ensure that all exercise instances are cleaned up, too
            // → join

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
});
