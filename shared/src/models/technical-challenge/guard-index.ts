import type { TaskType } from '../task-type.js';
import type { Guard, GuardId, Timer } from './guard.js';
import type { StateMachine, Transition } from './state-machine.js';

/**
 * A flat, id-referencing summary of a single guard node — deliberately
 * not the live `Guard`/`WritableDraft<Guard>` object. `GuardIndex` is
 * cached across many separate Immer `produce()` calls (ticks), and a
 * WritableDraft proxy captured during one `produce()` call is revoked once
 * that call finishes; storing only plain, copied primitives/ids avoids
 * ever holding on to a proxy past its call.
 */
export type GuardSummary =
    | {
          readonly id: GuardId;
          readonly type: 'taskGuard';
          readonly taskId: TaskType['id'];
          readonly minProgress: number;
      }
    | {
          readonly id: GuardId;
          readonly type: 'timerGuard';
          readonly timerId: Timer['id'];
          readonly minProgress: number;
      }
    | { readonly id: GuardId; readonly type: 'andGuard'; readonly childIds: readonly GuardId[] }
    | { readonly id: GuardId; readonly type: 'notGuard'; readonly childId: GuardId };

/**
 * Runtime-only, derived view of a state machine's guard trees.
 *
 * This is deliberately kept out of `StateMachine`/`ExerciseState`: guard
 * trees are small and this index only depends on their (rarely changing)
 * topology, not on `ExerciseState`. Keeping it here means it never needs to
 * be persisted, diffed, or sent over the socket, and it works identically
 * wherever the (isomorphic) reducer code happens to run — backend or
 * frontend — without any coupling to backend-only objects like
 * `ActiveExercise`.
 */
export interface GuardIndex {
    /** guardId -> id of its parent guard, or null if it's a transition's root guard */
    readonly parentOf: ReadonlyMap<GuardId, GuardId | null>;
    /** guardId -> the transition it belongs to */
    readonly transitionOf: ReadonlyMap<GuardId, Transition['id']>;
    /**
     * taskId -> transitionId -> ids of the taskGuard leaves (within that
     * transition's guard tree) that reference that task. A task can appear
     * as more than one leaf within the same transition's tree.
     */
    readonly taskGuardsByTransition: ReadonlyMap<
        TaskType['id'],
        ReadonlyMap<Transition['id'], readonly GuardId[]>
    >;
    /** guardId -> a plain summary of that node, avoids re-walking the tree to resolve one by id */
    readonly guardById: ReadonlyMap<GuardId, GuardSummary>;
    /**
     * Volatile cache: "next timestamp this guard's truth value changes".
     * Scoped to this state machine instance, so it can't collide with a
     * different state machine's identically-numbered guards (see
     * `getGuardIndex`).
     */
    readonly nextChangeOf: Map<GuardId, number>;
}

interface MutableIndexParts {
    parentOf: Map<GuardId, GuardId | null>;
    transitionOf: Map<GuardId, Transition['id']>;
    taskGuardsByTransition: Map<TaskType['id'], Map<Transition['id'], GuardId[]>>;
    guardById: Map<GuardId, GuardSummary>;
}

function visitGuard(
    guard: Guard,
    transitionId: Transition['id'],
    parentId: GuardId | null,
    index: MutableIndexParts
): void {
    index.parentOf.set(guard.id, parentId);
    index.transitionOf.set(guard.id, transitionId);

    switch (guard.type) {
        case 'taskGuard': {
            index.guardById.set(guard.id, {
                id: guard.id,
                type: 'taskGuard',
                taskId: guard.taskId,
                minProgress: guard.minProgress,
            });
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
            return;
        }
        case 'timerGuard':
            index.guardById.set(guard.id, {
                id: guard.id,
                type: 'timerGuard',
                timerId: guard.timerId,
                minProgress: guard.minProgress,
            });
            return;
        case 'andGuard':
            index.guardById.set(guard.id, {
                id: guard.id,
                type: 'andGuard',
                childIds: guard.guards.map((child) => child.id),
            });
            for (const child of guard.guards)
                visitGuard(child, transitionId, guard.id, index);
            return;
        case 'notGuard':
            index.guardById.set(guard.id, {
                id: guard.id,
                type: 'notGuard',
                childId: guard.guard.id,
            });
            visitGuard(guard.guard, transitionId, guard.id, index);
    }
}

function buildGuardIndex(stateMachine: StateMachine): GuardIndex {
    const parts: MutableIndexParts = {
        parentOf: new Map(),
        transitionOf: new Map(),
        taskGuardsByTransition: new Map(),
        guardById: new Map(),
    };

    for (const state of Object.values(stateMachine.states)) {
        for (const transition of Object.values(state.outgoingTransitions)) {
            visitGuard(transition.guard, transition.id, null, parts);
        }
    }

    return { ...parts, nextChangeOf: new Map() };
}

const guardIndexByStateMachine = new Map<StateMachine['id'], GuardIndex>();

/**
 * Lazily builds and caches the guard index for a state machine.
 * Safe to call with a `WritableDraft<StateMachine>` — `.id` reads through
 * the Immer proxy without issue, and the index itself never stores a
 * reference to the draft (see {@link GuardSummary}).
 */
export function getGuardIndex(stateMachine: StateMachine): GuardIndex {
    let index = guardIndexByStateMachine.get(stateMachine.id);
    if (!index) {
        index = buildGuardIndex(stateMachine);
        guardIndexByStateMachine.set(stateMachine.id, index);
    }
    return index;
}

/**
 * Call whenever a state machine's guard tree topology changes (transitions
 * or guards added, edited, or removed), and when a state machine is
 * permanently gone (e.g. its exercise was deleted), to avoid serving a
 * stale index and to let the old one be garbage collected.
 */
export function invalidateGuardIndex(stateMachineId: StateMachine['id']): void {
    guardIndexByStateMachine.delete(stateMachineId);
}
