import { z } from 'zod';
import { simulationEventSchema } from './simulation-event.js';

export const sendRequestEventSchema = simulationEventSchema.extend({
    type: z.literal('sendRequestEvent'),
});

export type SendRequestEvent = z.infer<typeof sendRequestEventSchema>;

export function newSendRequestEvent(): SendRequestEvent {
    return {
        type: 'sendRequestEvent',
    };
}
