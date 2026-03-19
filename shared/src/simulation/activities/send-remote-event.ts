import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { ExerciseSimulationEvent } from '../events/index.js';
import { exerciseSimulationEventSchema } from '../events/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import { tryGetElement } from '../../store/action-reducers/utils/index.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

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
