import { z } from 'zod';
import { exerciseTimeSchema } from '../time.js';
import type { GuardId, StateMachineId, TechnicalChallengeId } from './ids.js';
import {
    guardIdSchema,
    stateMachineIdSchema,
    technicalChallengeIdSchema,
} from './ids.js';

export const stateMachineEventSchema = z.strictObject({
    type: z.literal('stateMachineEvent'),
    timestamp: exerciseTimeSchema,
    technicalChallengeId: technicalChallengeIdSchema,
    stateMachineId: stateMachineIdSchema,
    guardId: guardIdSchema,
});

export type StateMachineEvent = z.infer<typeof stateMachineEventSchema>;

export function newStateMachineEvent(
    timestamp: number,
    technicalChallengeId: TechnicalChallengeId,
    stateMachineId: StateMachineId,
    guardId: GuardId
): StateMachineEvent {
    return {
        type: 'stateMachineEvent',
        timestamp,
        technicalChallengeId,
        stateMachineId,
        guardId,
    };
}

export const stateMachineEventQueueSchema = z.strictObject({
    events: z.array(stateMachineEventSchema),
    guardIndices: z.record(guardIdSchema, z.int().nonnegative()),
    guardIdsOf: z.record(
        stateMachineIdSchema,
        z.record(guardIdSchema, z.boolean())
    ),
});

export type StateMachineEventQueue = z.infer<
    typeof stateMachineEventQueueSchema
>;

export function newStateMachineEventQueue(): StateMachineEventQueue {
    return {
        events: [],
        guardIndices: {},
        guardIdsOf: {},
    };
}
