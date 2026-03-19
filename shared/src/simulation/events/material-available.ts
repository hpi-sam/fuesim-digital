import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const materialAvailableEventSchema = simulationEventSchema.extend({
    type: z.literal('materialAvailableEvent'),
    materialId: uuidSchema,
});
export type MaterialAvailableEvent = z.infer<
    typeof materialAvailableEventSchema
>;

export function newMaterialAvailableEvent(
    materialId: UUID
): MaterialAvailableEvent {
    return { type: 'materialAvailableEvent', materialId };
}
