import { z } from 'zod';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { personnelSchema } from '../../models/personnel.js';
import type { ActionReducer } from '../action-reducer.js';
import { uuidSchema } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { technicalChallengeSchema } from '../../models/technical-challenge/technical-challenge.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { sizeSchema } from '../../models/utils/size.js';
import { ReducerError } from '../reducer-error.js';
import {
    currentStateOf,
    stateMachineSchema,
    stateMachineStateSchema,
    updateEventQueue,
} from '../../models/technical-challenge/state-machine.js';
import { taskTypeSchema } from '../../models/task-type.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { userGeneratedContentSchema } from '../../models/user-generated-content.js';
import { createScoutableTag } from '../../models/utils/tag-helpers.js';
import { getElement } from './utils/get-element.js';
import {
    logTechnicalChallenge,
    logTechnicalChallengePersonnelAssigned,
} from './utils/log.js';
import { PersonnelActionReducers } from './personnel.js';
import { technicalChallengeIdSchema } from '../../models/technical-challenge/ids.js';

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
    stateMachineId: stateMachineSchema.shape.id,
    taskId: taskTypeSchema.shape.id,
});

const resizeTechnicalChallengeActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Resize technical challenge'),
    technicalChallengeId: technicalChallengeIdSchema,
    targetPosition: mapCoordinatesSchema,
    newSize: sizeSchema,
});

const updateTechnicalChallengeStateContentActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Update state content'),
    technicalChallengeId: technicalChallengeIdSchema,
    stateMachineId: stateMachineSchema.shape.id,
    stateId: stateMachineStateSchema.shape.id,
    userGeneratedContent: userGeneratedContentSchema,
});

const markTechnicalChallengeStateAsViewedActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallenge] Mark state as viewed'),
    technicalChallengeId: technicalChallengeIdSchema,
    stateMachineId: stateMachineSchema.shape.id,
    stateId: stateMachineStateSchema.shape.id,
});

export namespace TechnicalChallengeActionReducers {
    export const addTechnicalChallenge: ActionReducer<CreateTechnicalChallengeAction> =
        {
            type: '[TechnicalChallenge] Create technical challenge',
            actionSchema: createTechnicalChallengeActionSchema,
            reducer: (draftState, action) => {
                draftState.technicalChallenges[action.technicalChallenge.id] =
                    cloneDeepMutable(action.technicalChallenge);
                for (const stateMachine of Object.values(
                    draftState.technicalChallenges[
                        action.technicalChallenge.id
                    ]!.stateMachines
                ))
                    updateEventQueue(
                        draftState,
                        action.technicalChallenge.id,
                        stateMachine
                    );
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
            {
                technicalChallengeId,
                personnelId,
                taskId,
                targetPosition,
                stateMachineId,
            }
        ) => {
            const technicalChallenge = getElement(
                draftState,
                'technicalChallenge',
                technicalChallengeId
            );
            const stateMachine =
                technicalChallenge.stateMachines[stateMachineId];
            if (!stateMachine) {
                throw new ReducerError(
                    `StateMachine ${stateMachineId} not found in technical challenge ${technicalChallenge.id}.`
                );
            }

            if (!(taskId in currentStateOf(stateMachine).possibleTasks)) {
                throw new ReducerError(
                    `Task ${taskId} is not possible in current state ${stateMachine.currentStateId}`
                );
            }

            stateMachine.assignedPersonnel[personnelId] = taskId;

            updateEventQueue(draftState, technicalChallengeId, stateMachine);

            logTechnicalChallengePersonnelAssigned(
                draftState,
                technicalChallengeId,
                personnelId,
                taskId
            );

            PersonnelActionReducers.movePersonnel.reducer(draftState, {
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
    export const updateTechnicalChallengeStateContent: ActionReducer<
        z.infer<typeof updateTechnicalChallengeStateContentActionSchema>
    > = {
        type: updateTechnicalChallengeStateContentActionSchema.shape.type.value,
        actionSchema: updateTechnicalChallengeStateContentActionSchema,
        reducer: (draftState, action) => {
            const technicalChallenge = getElement(
                draftState,
                'technicalChallenge',
                action.technicalChallengeId
            );
            const stateMachine =
                technicalChallenge.stateMachines[action.stateMachineId];
            if (!stateMachine) {
                throw new ReducerError(
                    `StateMachine ${action.stateMachineId} not found in technical challenge ${technicalChallenge.id}.`
                );
            }

            const state = currentStateOf(stateMachine);

            state.userGeneratedContent = cloneDeepMutable(
                action.userGeneratedContent
            );
            return draftState;
        },
        rights: 'trainer',
    };
    export const markTechnicalChallengeStateAsViewed: ActionReducer<
        z.infer<typeof markTechnicalChallengeStateAsViewedActionSchema>
    > = {
        type: markTechnicalChallengeStateAsViewedActionSchema.shape.type.value,
        actionSchema: markTechnicalChallengeStateAsViewedActionSchema,
        reducer: (draftState, action) => {
            const challenge = getElement(
                draftState,
                'technicalChallenge',
                action.technicalChallengeId
            );
            const stateMachine = challenge.stateMachines[action.stateMachineId];
            if (!stateMachine) {
                throw new ReducerError(
                    `StateMachine ${action.stateMachineId} not found in technical challenge ${challenge.id}.`
                );
            }
            const state = stateMachine.states[action.stateId];
            if (!state)
                throw new ReducerError(
                    `Unknown StateId ${action.stateId} in TechnicalChallenge ${action.technicalChallengeId}`
                );
            state.viewedByParticipants = true;

            logTechnicalChallenge(
                draftState,
                [createScoutableTag(stateMachine.name, state.id)],
                `Es wurde "${state.title}" erkundet.`,
                challenge.id
            );
            return draftState;
        },
        rights: 'participant',
    };
}
