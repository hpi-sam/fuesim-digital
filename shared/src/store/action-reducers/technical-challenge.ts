import { z } from 'zod';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { personnelSchema } from '../../models/personnel.js';
import type { ActionReducer } from '../action-reducer.js';
import { uuidSchema } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import {
    technicalChallengeIdSchema,
    technicalChallengeSchema,
} from '../../models/technical-challenge/technical-challenge.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { sizeSchema } from '../../models/utils/size.js';
import { ReducerError } from '../reducer-error.js';
import { currentStateOf } from '../../models/technical-challenge/state-machine.js';
import { taskSchema } from '../../models/task.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';
import { lookupReducerFor } from './action-reducers.js';

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

export namespace TechnicalChallengeActionReducers {
    export const addTechnicalChallenge: ActionReducer<CreateTechnicalChallengeAction> =
        {
            type: '[TechnicalChallenge] Create technical challenge',
            actionSchema: createTechnicalChallengeActionSchema,
            reducer: (draftState, action) => {
                draftState.technicalChallenges[action.technicalChallenge.id] =
                    cloneDeepMutable(action.technicalChallenge);
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
