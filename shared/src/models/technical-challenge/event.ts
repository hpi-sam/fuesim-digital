import { z } from 'zod';
import { exerciseTimeSchema } from '../time.js';
import type {
    StateMachineId,
    TechnicalChallengeId,
    TransitionId,
} from './ids.js';
import {
    stateMachineIdSchema,
    technicalChallengeIdSchema,
    transitionIdSchema,
} from './ids.js';

export const stateMachineEventSchema = z.strictObject({
    type: z.literal('stateMachineEvent'),
    timestamp: exerciseTimeSchema,
    technicalChallengeId: technicalChallengeIdSchema,
    stateMachineId: stateMachineIdSchema,
    transitionId: transitionIdSchema,
});

export type StateMachineEvent = z.infer<typeof stateMachineEventSchema>;

export function newStateMachineEvent(
    timestamp: number,
    technicalChallengeId: TechnicalChallengeId,
    stateMachineId: StateMachineId,
    transitionId: TransitionId
): StateMachineEvent {
    return {
        type: 'stateMachineEvent',
        timestamp,
        technicalChallengeId,
        stateMachineId,
        transitionId,
    };
}

export const stateMachineEventQueueSchema = z.strictObject({
    events: z.array(stateMachineEventSchema),
    indices: z.record(stateMachineIdSchema, z.int().nonnegative()),
});

export type StateMachineEventQueue = z.infer<
    typeof stateMachineEventQueueSchema
>;

export function newStateMachineEventQueue(): StateMachineEventQueue {
    return {
        events: [],
        indices: {},
    };
}
