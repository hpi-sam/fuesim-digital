import { z } from 'zod';
import type { ActionReducer, MapPosition } from '../../index.js';
import {
    newMapPositionAt,
    uuidSchema,
    mapCoordinatesSchema,
} from '../../index.js';
import { technicalChallengeSchema } from '../../models/index.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { personnelSchema } from '../../models/personnel.js';

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
});

export namespace TechnicalChallengeActionReducers {
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
        reducer: (draftState, { technicalChallengeId, personnelId }) => {
            const technicalChallenge =
                draftState.technicalChallenges[technicalChallengeId];
            console.log(
                `assigning: ${technicalChallenge!.relevantTasks[0]!.id}`
            );
            if (technicalChallenge) {
                // TODO: assign task & validate if exists
                technicalChallenge.assignedPersonnel[personnelId] =
                    // @ts-expect-error TODO: testing
                    technicalChallenge.relevantTasks[0].id;
            }
            return draftState;
        },
        rights: 'participant',
    };
}
