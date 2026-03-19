import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import type { ExerciseSimulationEvent } from '../events/exercise-simulation-event.js';
import { exerciseSimulationEventSchema } from '../events/exercise-simulation-event.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const delayEventActivityStateSchema =
    simulationActivityStateSchema.extend({
        type: z.literal('delayEventActivity'),
        event: exerciseSimulationEventSchema,
        endTime: z.int().nonnegative(),
    });
export type DelayEventActivityState = z.infer<
    typeof delayEventActivityStateSchema
>;

export function newDelayEventActivityState(
    id: UUID,
    event: ExerciseSimulationEvent,
    endTime: number
): DelayEventActivityState {
    return {
        id,
        type: 'delayEventActivity',
        event,
        endTime,
    };
}

export const delayEventActivity: SimulationActivity<DelayEventActivityState> = {
    activityStateSchema: delayEventActivityStateSchema,
    tick(draftState, simulatedRegion, activityState, _tickInterval, terminate) {
        if (draftState.currentTime >= activityState.endTime) {
            sendSimulationEvent(simulatedRegion, activityState.event);
            terminate();
        }
    },
};
