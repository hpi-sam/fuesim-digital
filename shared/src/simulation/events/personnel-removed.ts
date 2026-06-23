import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const personnelRemovedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('personnelRemovedEvent'),
    personnelId: uuidSchema,
});
export type PersonnelRemovedEvent = Immutable<
    z.infer<typeof personnelRemovedEventSchema>
>;

export function newPersonnelRemovedEvent(
    personnelId: string
): PersonnelRemovedEvent {
    return {
        type: 'personnelRemovedEvent',
        personnelId,
    };
}
