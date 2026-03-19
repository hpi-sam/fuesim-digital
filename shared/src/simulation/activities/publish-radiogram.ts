import { z } from 'zod';
import type { ExerciseRadiogram } from '../../models/radiogram/exercise-radiogram.js';
import { exerciseRadiogramSchema } from '../../models/radiogram/exercise-radiogram.js';
import { publishRadiogram } from '../../models/radiogram/radiogram-helpers-mutable.js';
import type { UUID } from '../../utils/index.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const publishRadiogramActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('publishRadiogramActivity'),
    radiogram: exerciseRadiogramSchema,
});
export type PublishRadiogramActivityState = z.infer<
    typeof publishRadiogramActivityStateSchema
>;

export function newPublishRadiogramActivityState(
    id: UUID,
    radiogram: ExerciseRadiogram
): PublishRadiogramActivityState {
    return {
        id,
        type: 'publishRadiogramActivity',
        radiogram,
    };
}

export const publishRadiogramActivity: SimulationActivity<PublishRadiogramActivityState> =
    {
        activityStateSchema: publishRadiogramActivityStateSchema,
        tick(
            draftState,
            _simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            publishRadiogram(draftState, activityState.radiogram);
            terminate();
        },
    };
