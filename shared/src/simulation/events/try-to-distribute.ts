import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const tryToDistributeEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('tryToDistributeEvent'),
    behaviorId: uuidSchema,
});

export type TryToDistributeEvent = Immutable<
    z.infer<typeof tryToDistributeEventSchema>
>;

export function newTryToDistributeEvent(
    behaviorId: UUID
): TryToDistributeEvent {
    return { type: 'tryToDistributeEvent', behaviorId };
}
