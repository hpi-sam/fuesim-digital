import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const tryToDistributeEventSchema = simulationEventSchema.extend({
    type: z.literal('tryToDistributeEvent'),
    behaviorId: uuidSchema,
});

export type TryToDistributeEvent = z.infer<typeof tryToDistributeEventSchema>;

export function newTryToDistributeEvent(
    behaviorId: UUID
): TryToDistributeEvent {
    return { type: 'tryToDistributeEvent', behaviorId };
}
