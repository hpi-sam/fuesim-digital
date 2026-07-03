import type { TaskType } from '../task-type.js';
import {
    type StateMachine,
    type Transition,
    type Guard,
} from './state-machine.js';
import type { GuardId, StateMachineId, TransitionId } from './ids.js';

export interface NextChange {
    currentValue: boolean;
    nextValue: boolean;
    changeTimestamp: number;
    // `and`-node specific values
    latestTrue?: number;
    earliestFalse?: number;
}

export interface GuardIndex {
    parentOf: Map<GuardId, GuardId | null>;
    transitionOf: Map<GuardId, TransitionId>;
    taskGuardsByTransition: Map<TaskType['id'], Map<TransitionId, GuardId[]>>;
    guardById: Map<GuardId, Guard>;
    nextChangeOf: Map<GuardId, NextChange>;
}

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
