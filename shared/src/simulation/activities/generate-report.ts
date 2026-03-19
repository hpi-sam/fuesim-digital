import { z } from 'zod';
import type { ExerciseRadiogram } from '../../models/radiogram/exercise-radiogram.js';
import { exerciseRadiogramSchema } from '../../models/radiogram/exercise-radiogram.js';
import { publishRadiogram } from '../../models/radiogram/radiogram-helpers-mutable.js';
import type { UUID } from '../../utils/index.js';
import type { ExerciseSimulationEvent } from '../events/index.js';
import { exerciseSimulationEventSchema } from '../events/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const generateReportActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('generateReportActivity'),
    radiogram: exerciseRadiogramSchema,
    collectEvent: exerciseSimulationEventSchema,
    hasSendEvent: z.boolean(),
});

export type GenerateReportActivityState = z.infer<
    typeof generateReportActivityStateSchema
>;

export function newGenerateReportActivityState(
    id: UUID,
    radiogram: ExerciseRadiogram,
    collectEvent: ExerciseSimulationEvent
): GenerateReportActivityState {
    return {
        id,
        type: 'generateReportActivity',
        radiogram,
        collectEvent,
        hasSendEvent: false,
    };
}

export const generateReportActivity: SimulationActivity<GenerateReportActivityState> =
    {
        activityStateSchema: generateReportActivityStateSchema,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            if (!activityState.hasSendEvent) {
                sendSimulationEvent(
                    simulatedRegion,
                    activityState.collectEvent
                );
                activityState.hasSendEvent = true;
            } else {
                publishRadiogram(draftState, activityState.radiogram);
                terminate();
            }
        },
    };
