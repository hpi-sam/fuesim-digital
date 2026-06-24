import { z } from 'zod';
import { exerciseTimeSchema } from '../time.js';
import type { UUID } from '../../utils/uuid.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import type { StateMachineId } from './ids.js';
import { stateMachineIdSchema } from './ids.js';

export const stateMachineEventSchema = z.strictObject({
    type: z.literal('stateMachineEvent'),
    id: uuidSchema,
    timestamp: exerciseTimeSchema,
    stateMachineId: stateMachineIdSchema,
    transitionId: uuidSchema,
});

export type StateMachineEvent = z.infer<typeof stateMachineEventSchema>;

export function newStateMachineEvent(
    timestamp: number,
    stateMachineId: StateMachineId,
    transitionId: UUID
): StateMachineEvent {
    return {
        type: 'stateMachineEvent',
        id: uuid(),
        timestamp,
        stateMachineId,
        transitionId,
    };
}

export const technicalChallengeEventQueueSchema = z.strictObject({
    events: z.array(stateMachineEventSchema),
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
