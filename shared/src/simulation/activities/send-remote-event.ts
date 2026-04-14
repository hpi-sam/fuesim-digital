import { z } from 'zod';
import { sendSimulationEvent } from '../events/utils.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    type ExerciseSimulationEvent,
    exerciseSimulationEventSchema,
} from '../events/exercise-simulation-event.js';
import { tryGetElement } from '../../store/action-reducers/utils/get-element.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

export const sendRemoteEventActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('sendRemoteEventActivity'),
    targetSimulatedRegionId: uuidSchema,
    event: exerciseSimulationEventSchema,
});
export type SendRemoteEventActivityState = z.infer<
    typeof sendRemoteEventActivityStateSchema
>;

export function newSendRemoteEventActivityState(
    id: UUID,
    targetSimulatedRegionId: UUID,
    event: ExerciseSimulationEvent
): SendRemoteEventActivityState {
    return {
        id,
        type: 'sendRemoteEventActivity',
        targetSimulatedRegionId,
        event,
    };
}

export const sendRemoteEventActivity: SimulationActivity<SendRemoteEventActivityState> =
    {
        activityStateSchema: sendRemoteEventActivityStateSchema,
        tick(
            draftState,
            _simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            const targetSimulatedRegion = tryGetElement(
                draftState,
                'simulatedRegion',
                activityState.targetSimulatedRegionId
            );
            if (targetSimulatedRegion) {
                sendSimulationEvent(targetSimulatedRegion, activityState.event);
            }
            terminate();
        },
    };
