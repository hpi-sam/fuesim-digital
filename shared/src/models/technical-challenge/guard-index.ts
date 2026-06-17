import { z } from 'zod';
import { taskTypeSchema } from '../task-type.js';
import {
    type StateMachine,
    type Transition,
    type Guard,
    guardSchema,
} from './state-machine.js';
import type { GuardId, StateMachineId } from './ids.js';
import { guardIdSchema, transitionIdSchema } from './ids.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const guardIndexSchema = z.strictObject({
    parentOf: z.map(guardIdSchema, guardIdSchema.nullable()),
    transitionOf: z.map(guardIdSchema, transitionIdSchema),
    taskGuardsByTransition: z.map(
        taskTypeSchema.shape.id,
        z.map(transitionIdSchema, z.array(guardIdSchema))
    ),
    guardById: z.map(guardIdSchema, guardSchema),
    nextChangeOf: z.map(guardIdSchema, z.number()),
});
export type GuardIndex = z.infer<typeof guardIndexSchema>;

function newGuardIndex(): GuardIndex {
    return {
        parentOf: new Map(),
        transitionOf: new Map(),
        taskGuardsByTransition: new Map(),
        guardById: new Map(),
        nextChangeOf: new Map(),
    };
}

function visitGuard(
    guard: Guard,
    transitionId: Transition['id'],
    parentId: GuardId | null,
    index: GuardIndex
): void {
    index.parentOf.set(guard.id, parentId);
    index.transitionOf.set(guard.id, transitionId);
    index.guardById.set(guard.id, guard);

    switch (guard.type) {
        case 'taskGuard': {
            let byTransition = index.taskGuardsByTransition.get(guard.taskId);
            if (!byTransition) {
                byTransition = new Map();
                index.taskGuardsByTransition.set(guard.taskId, byTransition);
            }
            let leaves = byTransition.get(transitionId);
            if (!leaves) {
                leaves = [];
                byTransition.set(transitionId, leaves);
            }
            leaves.push(guard.id);
            break;
        }
        case 'andGuard':
            for (const child of guard.guards)
                visitGuard(child, transitionId, guard.id, index);
            break;
        case 'notGuard':
            visitGuard(guard.guard, transitionId, guard.id, index);
            break;
        case 'timerGuard':
            break;
    }
}

function buildGuardIndex(stateMachine: StateMachine): GuardIndex {
    const index = newGuardIndex();

    for (const state of Object.values(stateMachine.states)) {
        for (const transition of Object.values(state.outgoingTransitions)) {
            visitGuard(transition.guard, transition.id, null, index);
        }
    }

    return index;
}

const guardIndexByStateMachine = new Map<StateMachineId, GuardIndex>();

export function getGuardIndex(stateMachine: StateMachine): GuardIndex {
    let index = guardIndexByStateMachine.get(stateMachine.id);
    if (!index) {
        index = buildGuardIndex(stateMachine);
        guardIndexByStateMachine.set(stateMachine.id, index);
    }
    return index;
}

export function invalidateGuardIndex(stateMachineId: StateMachine['id']): void {
    guardIndexByStateMachine.delete(stateMachineId);
}
