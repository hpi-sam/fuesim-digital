import type {
    StateMachineEvent,
    StateMachineEventQueue,
} from '../models/technical-challenge/event.js';
import type { StateMachineId } from '../models/technical-challenge/ids.js';

export function insert(
    queue: StateMachineEventQueue,
    event: StateMachineEvent
) {
    queue.events.push(event);
    queue.indices[event.stateMachineId] = queue.events.length - 1;
    bubbleUp(queue, queue.events.length - 1);
}

export function peek(queue: StateMachineEventQueue): StateMachineEvent | null {
    return queue.events[0] ?? null;
}

export function pop(queue: StateMachineEventQueue): StateMachineEvent | null {
    if (queue.events.length === 0) return null;
    if (queue.events.length === 1) {
        delete queue.indices[queue.events[0]!.stateMachineId];
        return queue.events.pop()!;
    }

    const min = queue.events[0]!;
    delete queue.indices[min.stateMachineId];

    queue.events[0] = queue.events.pop()!;
    queue.indices[queue.events[0].stateMachineId] = 0;
    bubbleDown(queue, 0);

    return min;
}

export function remove(
    queue: StateMachineEventQueue,
    id: StateMachineId
): boolean {
    const index = queue.indices[id];
    if (index === undefined) return false;

    if (index === queue.events.length - 1) {
        queue.events.pop();
        delete queue.indices[id];
        return true;
    }

    const lastIndex = queue.events.length - 1;
    swap(queue, index, lastIndex);

    queue.events.pop();
    delete queue.indices[id];

    bubbleUp(queue, index);
    bubbleDown(queue, index);

    return true;
}

export function modify(
    queue: StateMachineEventQueue,
    id: StateMachineId,
    updates: Partial<StateMachineEvent>
) {
    const index = queue.indices[id];
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

    queue.indices[queue.events[i].stateMachineId] = i;
    queue.indices[queue.events[j].stateMachineId] = j;
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
