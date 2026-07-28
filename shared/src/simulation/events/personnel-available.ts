import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const personnelAvailableEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('personnelAvailableEvent'),
    personnelId: uuidSchema,
});
export type PersonnelAvailableEvent = Immutable<
    z.infer<typeof personnelAvailableEventSchema>
>;

export function newPersonnelAvailableEvent(
    personnelId: string
): PersonnelAvailableEvent {
    return {
        type: 'personnelAvailableEvent',
        personnelId,
    };
}
