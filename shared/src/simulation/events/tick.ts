import { z } from 'zod';
import { simulationEventSchema } from './simulation-event.js';

export const tickEventSchema = simulationEventSchema.extend({
    type: z.literal('tickEvent'),
    tickInterval: z.int().positive(),
});
export type TickEvent = z.infer<typeof tickEventSchema>;

export function newTickEvent(tickInterval: number): TickEvent {
    return {
        type: 'tickEvent',
        tickInterval,
    };
}
