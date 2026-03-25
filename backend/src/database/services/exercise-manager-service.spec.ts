import type { ExerciseAction } from 'fuesim-digital-shared';
import { uuid } from 'fuesim-digital-shared';
import {
    createExerciseTemplate,
    createTestEnvironment,
    createTestUserSession,
} from '../../test/utils.js';

describe('exercise manager service', () => {
    const environment = createTestEnvironment();

    it('correctly copies data from exercise template to exercise', async () => {
        const session = await createTestUserSession(environment);
        const sessionInformation =
            (await environment.services.authService.getDataFromSessionToken(
                session
            ))!;

        // Create exercise template and do action
        const exerciseTemplate = await createExerciseTemplate(
            environment,
            session
        );
        const exercise = environment.services.exerciseService.getExerciseByKey(
            exerciseTemplate.trainerKey,
            sessionInformation
        );
        const action: ExerciseAction = {
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: {
                alarmGroupVehicles: {},
                id: uuid(),
                type: 'alarmGroup',
                name: 'Alarm Group',
                triggerCount: 0,
                triggerLimit: null,
            },
        };
        exercise.applyAction(action, null);

        // Copy exercise template
        const newActiveExercise =
            await environment.services.exerciseManagerService.createExerciseFromTemplate(
                exerciseTemplate.id,
                'standalone',
                sessionInformation
            );
        expect(
            environment.services.exerciseService.TESTING_getExerciseMap().size
        ).toBe(6);

        // Check correctness of state
        expect(
            newActiveExercise.exercise.currentStateString.alarmGroups[
                action.alarmGroup.id
            ]
        ).toMatchObject(action.alarmGroup);

        // Check correctness of actions
        expect(newActiveExercise.temporaryActionHistory).toHaveLength(0);
    });
});
