import { z } from 'zod';
import type { ExerciseRescueResource } from '../../models/utils/rescue-resource.js';
import { exerciseRescueResourceSchema } from '../../models/utils/rescue-resource.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const resourceRequiredEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('resourceRequiredEvent'),
    requiringSimulatedRegionId: uuidSchema,
    requiredResource: exerciseRescueResourceSchema,
    key: z.string(),
});
export type ResourceRequiredEvent = z.infer<typeof resourceRequiredEventSchema>;

export function newResourceRequiredEvent(
    requiringSimulatedRegionId: UUID,
    requiredResource: ExerciseRescueResource,
    key: string
): ResourceRequiredEvent {
    return {
        type: 'resourceRequiredEvent',
        requiringSimulatedRegionId,
        requiredResource,
        key,
    };
}
