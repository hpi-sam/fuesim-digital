import { z } from 'zod';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const personnelAvailableEventSchema = simulationEventSchema.extend({
    type: z.literal('personnelAvailableEvent'),
    personnelId: uuidSchema,
});
export type PersonnelAvailableEvent = z.infer<
    typeof personnelAvailableEventSchema
>;

export function newPersonnelAvailableEvent(
    personnelId: string
): PersonnelAvailableEvent {
    return {
        type: 'personnelAvailableEvent',
        personnelId,
    };
}
