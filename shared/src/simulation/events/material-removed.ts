import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const materialRemovedEventSchema = simulationEventSchema.extend({
    type: z.literal('materialRemovedEvent'),
    materialId: uuidSchema,
});

export type MaterialRemovedEvent = z.infer<typeof materialRemovedEventSchema>;

export function newMaterialRemovedEvent(
    materialId: UUID
): MaterialRemovedEvent {
    return {
        type: 'materialRemovedEvent',
        materialId,
    };
}
