import { z } from 'zod';
import { exerciseTimeSchema } from '../time.js';
import type { UUID} from '../../utils/uuid.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { type TechnicalChallengeId, technicalChallengeIdSchema } from './technical-challenge-id.js';

export const technicalChallengeEventSchema = z.strictObject({
    type: z.literal('technicalChallengeEvent'),
    id: uuidSchema,
    timestamp: exerciseTimeSchema,
    technicalChallengeId: technicalChallengeIdSchema,
    transitionId: uuidSchema,
});

export type TechnicalChallengeEvent = z.infer<
    typeof technicalChallengeEventSchema
>;

export function newTechnicalChallengeEvent(
    timestamp: number,
    technicalChallengeId: TechnicalChallengeId,
    transitionId: UUID
): TechnicalChallengeEvent {
    return {
        type: 'technicalChallengeEvent',
        id: uuid(),
        timestamp,
        technicalChallengeId,
        transitionId,
    };
}

export const technicalChallengeEventQueueSchema = z.strictObject({
    events: z.array(technicalChallengeEventSchema),
    indices: z.record(uuidSchema, z.int().nonnegative()),
});

export type TechnicalChallengeEventQueue = z.infer<
    typeof technicalChallengeEventQueueSchema
>;

export function newTechnicalChallengeEventQueue(): TechnicalChallengeEventQueue {
    return {
        events: [],
        indices: {},
    };
}
