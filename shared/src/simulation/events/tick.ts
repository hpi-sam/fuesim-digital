import { z } from 'zod';
import type { Immutable } from 'immer';
import { simulationEventSchema } from './simulation-event.js';

export const tickEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('tickEvent'),
    tickInterval: z.int().positive(),
});
export type TickEvent = Immutable<z.infer<typeof tickEventSchema>>;

export function newTickEvent(tickInterval: number): TickEvent {
    return {
        type: 'tickEvent',
        tickInterval,
    };
}
