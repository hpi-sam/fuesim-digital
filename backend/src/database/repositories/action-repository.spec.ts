import { eq } from 'drizzle-orm';
import type { SetPretriageEnabledAction } from '../../../../shared/dist/store/action-reducers/configuration.js';
import { createTestEnvironment } from '../../test/utils.js';
import { ActionWrapper } from '../../exercise/action-wrapper.js';
import { UserReadableIdGenerator } from '../../utils/user-readable-id-generator.js';
import { actionTable } from '../schema.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';

describe('ActionRepository', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        UserReadableIdGenerator.freeAll();
        environment.exerciseService.TESTING_getExerciseMap().clear();
    });

    it('should save and retrieve actions correctly', async () => {
        // We want to create an exercise like this manually
        // to simulate creating an exercise and adding actions
        // before the exercise actually has an id assigned
        // by the database.
        //
        // This is to test, wether action before exercise id assignment
        // are saved and retrieved correctly with this exerciseId.
        const activeExercise = ExerciseFactory.fromBlank();

        const actions = [
            new ActionWrapper(
                {
                    type: '[Configuration] Set pretriageEnabled',
                    pretriageEnabled: true,
                } satisfies SetPretriageEnabledAction,
                null,
                activeExercise,
                1
            ),
            new ActionWrapper(
                {
                    type: '[Configuration] Set pretriageEnabled',
                    pretriageEnabled: false,
                } satisfies SetPretriageEnabledAction,
                null,
                activeExercise,
                2
            ),
        ];

        // Save exercise in database and therefore assign id, after actions are created
        expect(activeExercise.exerciseId).toBeUndefined();
        await environment.exerciseService.createExercise(activeExercise);
        expect(activeExercise.exerciseId).toBeDefined();

        await environment.actionRepository.saveActions(actions);

        // TEMPLATES TO COMPARE AGAINST
        const expectedActions = actions.map((actionWrapper) => ({
            actionString: actionWrapper.getAction().actionString,
            emitterId: actionWrapper.getAction().emitterId,
            exerciseId: activeExercise.exerciseId,
            index: actionWrapper.getAction().index,
        }));
        expectedActions.sort((a, b) => a.index - b.index);

        const removeId = <T>(element: T): Omit<T, 'id'> => {
            // @ts-expect-error: id not on unknown type
            delete element.id;
            return element;
        };

        // MANUAL CHECK
        const exerciseActions =
            await environment.databaseService.databaseConnection
                .select()
                .from(actionTable)
                .where(eq(actionTable.exerciseId, activeExercise.exerciseId));
        exerciseActions.sort((a, b) => a.index - b.index);

        expect(exerciseActions[0]!.id).toBeDefined();
        expect(exerciseActions[1]!.id).toBeDefined();

        const exerciseActionsNoId = exerciseActions.map(removeId);

        expect(exerciseActionsNoId.length).toBe(2);
        expect(exerciseActionsNoId[0]).toEqual(expectedActions[0]!);
        expect(exerciseActionsNoId[1]).toEqual(expectedActions[1]!);

        // REPOSITORY METHOD CHECK
        const exerciseActions2 =
            await environment.actionRepository.getActionsForExerciseId(
                activeExercise.exerciseId
            );
        exerciseActions2.sort((a, b) => a.index - b.index);

        expect(exerciseActions2[0]!.id).toBeDefined();
        expect(exerciseActions2[1]!.id).toBeDefined();

        const exerciseActions2NoId = exerciseActions.map(removeId);

        expect(exerciseActions2NoId.length).toBe(2);
        expect(exerciseActions2NoId[0]).toEqual(expectedActions[0]!);
        expect(exerciseActions2NoId[1]).toEqual(expectedActions[1]!);
    });
});
