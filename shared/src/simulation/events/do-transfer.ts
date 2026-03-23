import { z } from 'zod';
import { simulationEventSchema } from './simulation-event.js';

export const doTransferEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('doTransferEvent'),
});
export type DoTransferEvent = z.infer<typeof doTransferEventSchema>;

export function newDoTransferEvent(): DoTransferEvent {
    return { type: 'doTransferEvent' };
}
