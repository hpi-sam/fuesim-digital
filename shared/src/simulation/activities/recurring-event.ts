import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import type { ExerciseSimulationEvent } from '../events/exercise-simulation-event.js';
import { exerciseSimulationEventSchema } from '../events/exercise-simulation-event.js';
import { sendSimulationEvent } from '../events/utils.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const recurringEventActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('recurringEventActivity'),
    event: exerciseSimulationEventSchema,
    lastOccurrenceTime: z.int().nonnegative(),
    recurrenceIntervalTime: z.int().nonnegative(),
});
export type RecurringEventActivityState = z.infer<
    typeof recurringEventActivityStateSchema
>;

export function newRecurringEventActivityState(
    id: UUID,
    event: ExerciseSimulationEvent,
    firstOccurrenceTime: number,
    recurrenceIntervalTime: number
): RecurringEventActivityState {
    return {
        id,
        type: 'recurringEventActivity',
        event,
        lastOccurrenceTime: firstOccurrenceTime - recurrenceIntervalTime,
        recurrenceIntervalTime,
    };
}

export const recurringEventActivity: SimulationActivity<RecurringEventActivityState> =
    {
        activityStateSchema: recurringEventActivityStateSchema,
        tick(draftState, simulatedRegion, activityState) {
            if (
                draftState.currentTime >=
                activityState.lastOccurrenceTime +
                    activityState.recurrenceIntervalTime
            ) {
                activityState.lastOccurrenceTime = draftState.currentTime;
                sendSimulationEvent(simulatedRegion, activityState.event);
            }
        },
    };
