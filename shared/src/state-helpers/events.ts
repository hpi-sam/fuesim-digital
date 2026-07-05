import type {
    StateMachineEvent,
    StateMachineEventQueue,
} from '../models/technical-challenge/event.js';
import type {
    GuardId,
    StateMachineId,
} from '../models/technical-challenge/ids.js';
import { TypeAssertedObject } from '../utils/type-asserted-object.js';

function guardIdsOf(
    queue: StateMachineEventQueue,
    stateMachineId: StateMachineId
): { [key: GuardId]: boolean } {
    let set = queue.guardIdsOf[stateMachineId];
    if (!set) {
        set = {};
        queue.guardIdsOf[stateMachineId] = set;
    }
    return set;
}

export function insert(
    queue: StateMachineEventQueue,
    event: StateMachineEvent
) {
    queue.events.push(event);
    queue.guardIndices[event.guardId] = queue.events.length - 1;
    guardIdsOf(queue, event.stateMachineId)[event.guardId] = true;
    bubbleUp(queue, queue.events.length - 1);
}

export function peek(queue: StateMachineEventQueue): StateMachineEvent | null {
    return queue.events[0] ?? null;
}

export function pop(queue: StateMachineEventQueue): StateMachineEvent | null {
    if (queue.events.length === 0) return null;
    if (queue.events.length === 1) {
        const event = queue.events.pop()!;
        delete queue.guardIndices[event.guardId];
        delete guardIdsOf(queue, event.stateMachineId)[event.guardId];
        return event;
    }

    const min = queue.events[0]!;
    delete queue.guardIndices[min.guardId];
    delete guardIdsOf(queue, min.stateMachineId)[min.guardId];

    queue.events[0] = queue.events.pop()!;
    queue.guardIndices[queue.events[0].guardId] = 0;
    bubbleDown(queue, 0);

    return min;
}

export function removeByGuardId(
    queue: StateMachineEventQueue,
    id: GuardId
): boolean {
    const index = queue.guardIndices[id];
    if (index === undefined) return false;

    if (index === queue.events.length - 1) {
        queue.events.pop();
        delete queue.guardIndices[id];
        return true;
    }

    const lastIndex = queue.events.length - 1;
    swap(queue, index, lastIndex);

    queue.events.pop();
    delete queue.guardIndices[id];

    bubbleUp(queue, index);
    bubbleDown(queue, index);

    return true;
}

export function removeByStateMachineId(
    queue: StateMachineEventQueue,
    stateMachineId: StateMachineId
): boolean {
    const set = queue.guardIdsOf[stateMachineId];

    if (set === undefined) return false;

    for (const guardId of TypeAssertedObject.keys(set)) {
        removeByGuardId(queue, guardId);
    }

    delete queue.guardIdsOf[stateMachineId];

    return true;
}

export function modify(
    queue: StateMachineEventQueue,
    id: GuardId,
    updates: Partial<StateMachineEvent>
) {
    const index = queue.guardIndices[id];
    if (index === undefined) return false;

    queue.events[index] = { ...queue.events[index]!, ...updates };

    bubbleUp(queue, index);
    bubbleDown(queue, index);

    return true;
}

function swap(queue: StateMachineEventQueue, i: number, j: number) {
    const tmp = queue.events[i]!;
    queue.events[i] = queue.events[j]!;
    queue.events[j] = tmp;

    queue.guardIndices[queue.events[i].guardId] = i;
    queue.guardIndices[queue.events[j].guardId] = j;
}

function bubbleUp(queue: StateMachineEventQueue, index: number) {
    let current = index;
    while (current > 0) {
        const parent = Math.floor((current - 1) / 2);
        if (queue.events[current]!.timestamp >= queue.events[parent]!.timestamp)
            break;

        swap(queue, current, parent);
        current = parent;
    }
}

function bubbleDown(queue: StateMachineEventQueue, index: number) {
    let current = index;
    const length = queue.events.length;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        const leftChild = 2 * current + 1;
        const rightChild = 2 * current + 2;
        let smallest = current;

        if (
            leftChild < length &&
            queue.events[leftChild]!.timestamp <
                queue.events[smallest]!.timestamp
        )
            smallest = leftChild;
        if (
            rightChild < length &&
            queue.events[rightChild]!.timestamp <
                queue.events[smallest]!.timestamp
        )
            smallest = rightChild;

        if (smallest === current) break;

        swap(queue, current, smallest);

        current = smallest;
    }
}
