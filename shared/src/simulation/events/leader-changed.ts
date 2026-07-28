import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const leaderChangedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('leaderChangedEvent'),
    oldLeaderId: uuidSchema.nullable(),
    newLeaderId: uuidSchema.nullable(),
});
export type LeaderChangedEvent = Immutable<
    z.infer<typeof leaderChangedEventSchema>
>;

export function newLeaderChangedEvent(
    oldLeaderId: UUID | null,
    newLeaderId: UUID | null
): LeaderChangedEvent {
    return { type: 'leaderChangedEvent', oldLeaderId, newLeaderId };
}
