import { z } from 'zod';
import { simulationEventSchema } from './simulation-event.js';

export const doTransferEventSchema = simulationEventSchema.extend({
    type: z.literal('doTransferEvent'),
});
export type DoTransferEvent = z.infer<typeof doTransferEventSchema>;

export function newDoTransferEvent(): DoTransferEvent {
    return { type: 'doTransferEvent' };
}
