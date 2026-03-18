import { z } from 'zod';
import type { ActionReducer, MapPosition } from '../../index.js';
import {
    lookupReducerFor,
    currentStateOf,
    ReducerError,
    taskSchema,
    getElement,
    sizeSchema,
    technicalChallengeIdSchema,
    newMapPositionAt,
    uuidSchema,
    mapCoordinatesSchema,
} from '../../index.js';
import {
    technicalChallengeSchema,
    personnelSchema,
} from '../../models/index.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';

const createTechnicalChallengeActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Create technical challenge'),
    technicalChallenge: technicalChallengeSchema,
});
export type CreateTechnicalChallengeAction = z.infer<
    typeof createTechnicalChallengeActionSchema
>;

const moveTechnicalChallengeActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Move technical challenge'),
    technicalChallengeId: uuidSchema,
    targetPosition: mapCoordinatesSchema,
});
export type MoveTechnicalChallengeAction = z.infer<
    typeof moveTechnicalChallengeActionSchema
>;

const assignTechnicalChallengeActionSchema = z.strictObject({
    type: z.literal(
        '[TechnicalChallenge] Assign a personnel to technical challenge'
    ),
    technicalChallengeId: technicalChallengeSchema.shape.id,
    personnelId: personnelSchema.shape.id,
    /**
     * assigned personnel is also moved to specified position
     */
    targetPosition: mapCoordinatesSchema,
    taskId: taskSchema.shape.id,
});

const resizeTechnicalChallengeActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Resize technical challenge'),
    technicalChallengeId: technicalChallengeIdSchema,
    targetPosition: mapCoordinatesSchema,
    newSize: sizeSchema,
});

namespace TechnicalChallengeActionReducers {
    export const addTechnicalChallenge: ActionReducer<CreateTechnicalChallengeAction> =
        {
            type: '[TechnicalChallenge] Create technical challenge',
            actionSchema: createTechnicalChallengeActionSchema,
            reducer: (draftState, action) => {
                console.log(
                    `want to place ${action.technicalChallenge.name} at ${(action.technicalChallenge.position as MapPosition).coordinates.x}${(action.technicalChallenge.position as MapPosition).coordinates.y}`
                );
                draftState.technicalChallenges[action.technicalChallenge.id] =
                    action.technicalChallenge;
                return draftState;
            },
            rights: 'trainer',
        };
    export const moveTechnicalChallenge: ActionReducer<MoveTechnicalChallengeAction> =
        {
            type: '[TechnicalChallenge] Move technical challenge',
            actionSchema: moveTechnicalChallengeActionSchema,
            reducer: (draftState, { technicalChallengeId, targetPosition }) => {
                changePositionWithId(
                    technicalChallengeId,
                    newMapPositionAt(targetPosition),
                    'technicalChallenge',
                    draftState
                );

                return draftState;
            },
            rights: 'trainer',
        };
    export const assignPersonnelToTechnicalChallenge: ActionReducer<
        z.infer<typeof assignTechnicalChallengeActionSchema>
    > = {
        type: assignTechnicalChallengeActionSchema.shape.type.value,
        actionSchema: assignTechnicalChallengeActionSchema,
        reducer: (
            draftState,
            { technicalChallengeId, personnelId, taskId, targetPosition }
        ) => {
            const technicalChallenge = getElement(
                draftState,
                'technicalChallenge',
                technicalChallengeId
            );

            if (!(taskId in currentStateOf(technicalChallenge).possibleTasks)) {
                throw new ReducerError(
                    `Task ${taskId} is not possible in current state ${technicalChallenge.currentStateId}`
                );
            }
            technicalChallenge.assignedPersonnel[personnelId] = taskId;

            lookupReducerFor('[Personnel] Move personnel').reducer(draftState, {
                type: '[Personnel] Move personnel',
                personnelId,
                targetPosition,
            });

            return draftState;
        },
        rights: 'participant',
    };
    export const resizeTechnicalChallenge: ActionReducer<
        z.infer<typeof resizeTechnicalChallengeActionSchema>
    > = {
        type: resizeTechnicalChallengeActionSchema.shape.type.value,
        actionSchema: resizeTechnicalChallengeActionSchema,
        reducer: (draftState, action) => {
            const technicalChallenge = getElement(
                draftState,
                'technicalChallenge',
                action.technicalChallengeId
            );
            technicalChallenge.position = newMapPositionAt(
                action.targetPosition
            );
            technicalChallenge.size = action.newSize;
            return draftState;
        },
        rights: 'trainer',
    };
}
export default TechnicalChallengeActionReducers;
