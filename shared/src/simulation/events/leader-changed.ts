import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const leaderChangedEventSchema = simulationEventSchema.extend({
    type: z.literal('leaderChangedEvent'),
    oldLeaderId: uuidSchema.nullable(),
    newLeaderId: uuidSchema.nullable(),
});
export type LeaderChangedEvent = z.infer<typeof leaderChangedEventSchema>;

export function newLeaderChangedEvent(
    oldLeaderId: UUID | null,
    newLeaderId: UUID | null
): LeaderChangedEvent {
    return { type: 'leaderChangedEvent', oldLeaderId, newLeaderId };
}
