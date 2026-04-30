import type {
    AddViewportAction,
    GetExerciseTemplateResponseData,
    GetParallelExerciseResponseData,
    PostParallelExerciseRequestData,
    Viewport,
} from 'fuesim-digital-shared';
import {
    getParallelExerciseResponseDataSchema,
    newViewport,
    postJoinParallelExerciseResponseDataSchema,
} from 'fuesim-digital-shared';
import type { ActiveExercise } from '../exercise/active-exercise.js';
import type { TestEnvironment } from './utils.js';
import { createExerciseTemplate } from './utils.js';

export function createViewport(exercise: ActiveExercise): Viewport {
    const addViewportAction: AddViewportAction = {
        type: '[Viewport] Add viewport',
        viewport: newViewport(
            {
                x: 0,
                y: 0,
            },
            ''
        ),
    };
    exercise.applyAction(addViewportAction, null);
    return Object.values(exercise.exercise.currentStateString.viewports)[0]!;
}

export async function createParallelExercise(
    environment: TestEnvironment,
    session: string,
    template?: GetExerciseTemplateResponseData
) {
    let exerciseTemplate;
    if (!template) {
        const userInfo =
            (await environment.services.authService.getDataFromSessionToken(
                session
            ))!.user;
        const personalOrganisation =
            await environment.services.organisationService.ensurePersonalOrganisation(
                userInfo
            );
        exerciseTemplate = await createExerciseTemplate(
            environment,
            session,
            personalOrganisation.id
        );
    } else {
        exerciseTemplate = template;
    }
    const exerciseId =
        (await environment.repositories.exerciseRepository.getExerciseTemplateById(
            exerciseTemplate.id
        ))!.exercise.id;

    const viewport = createViewport(
        environment.services.exerciseService
            .TESTING_getExerciseMap()
            .get(exerciseId)!
    );
    const response = await environment
        .httpRequest('post', '/api/parallel_exercises/', session)
        .send({
            name: 'Test Parallel Exercise',
            templateId: exerciseTemplate.id,
            joinViewportId: viewport.id,
        } satisfies PostParallelExerciseRequestData)
        .expect(201);

    return getParallelExerciseResponseDataSchema.parse(response.body);
}

export async function joinParallelExercise(
    environment: TestEnvironment,
    parallelExercise: GetParallelExerciseResponseData
) {
    const response = await environment
        .httpRequest(
            'post',
            `/api/parallel_exercises/join/${parallelExercise.participantKey}`
        )
        .expect(201);
    return postJoinParallelExerciseResponseDataSchema.parse(response.body);
}
