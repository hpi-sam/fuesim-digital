import { z } from 'zod';
import type { Immutable } from 'immer';
import { simulationEventSchema } from './simulation-event.js';

export const sendRequestEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('sendRequestEvent'),
});

export type SendRequestEvent = Immutable<
    z.infer<typeof sendRequestEventSchema>
>;

export function newSendRequestEvent(): SendRequestEvent {
    return {
        type: 'sendRequestEvent',
    };
}
