import { eq } from 'drizzle-orm';
import type { SetPretriageEnabledAction } from '../../../../shared/dist/store/action-reducers/configuration.js';
import { createExercise, createTestEnvironment } from '../../../test/utils.js';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import { UserReadableIdGenerator } from '../../utils/user-readable-id-generator.js';
import { actionTable } from '../schema.js';

describe('ActionRepository', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        UserReadableIdGenerator.freeAll();
        environment.exerciseService.TESTING_getExerciseMap().clear();
    });

    it('should save and retrieve actions correctly', async () => {
        const exerciseKeys = await createExercise(environment);
        const exercise = environment.exerciseService.getExerciseByKey(
            exerciseKeys.trainerId
        )!;
        expect(exercise).toBeDefined();

        const actions = [
            new ActionWrapper(
                {
                    type: '[Configuration] Set pretriageEnabled',
                    pretriageEnabled: true,
                } satisfies SetPretriageEnabledAction,
                null,
                exercise,
                1
            ),
            new ActionWrapper(
                {
                    type: '[Configuration] Set pretriageEnabled',
                    pretriageEnabled: false,
                } satisfies SetPretriageEnabledAction,
                null,
                exercise,
                2
            ),
        ];

        await environment.actionRepository.saveActions(
            actions,
            exercise.exerciseId
        );

        // MANUAL CHECK

        const exerciseActions =
            await environment.databaseService.databaseConnection
                .select()
                .from(actionTable)
                .where(eq(actionTable.exerciseId, exercise.exerciseId));

        expect(exerciseActions.length).toBe(2);
        exerciseActions.sort((a, b) => a.index - b.index);
        expect(exerciseActions[0]!.actionString).toEqual(
            actions[0]!.getAction().actionString
        );
        expect(exerciseActions[1]!.actionString).toEqual(
            actions[1]!.getAction().actionString
        );

        // Service check
        const exerciseActions2 =
            await environment.actionRepository.getActionsForExerciseId(
                exercise.exerciseId
            );
        expect(exerciseActions2.length).toBe(2);
        expect(exerciseActions2[0]!.actionString).toEqual(
            actions[0]!.getAction().actionString
        );
        expect(exerciseActions2[1]!.actionString).toEqual(
            actions[1]!.getAction().actionString
        );
    });
});
