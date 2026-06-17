import type {
    TechnicalChallengeEvent,
    TechnicalChallengeEventQueue,
} from '../models/technical-challenge/event.js';
import type { TechnicalChallengeId } from '../models/technical-challenge/technical-challenge-id.js';

export function insert(
    queue: TechnicalChallengeEventQueue,
    event: TechnicalChallengeEvent
) {
    queue.events.push(event);
    queue.indices[event.technicalChallengeId] = queue.events.length - 1;
    bubbleUp(queue, queue.events.length - 1);
}

export function peek(
    queue: TechnicalChallengeEventQueue
): TechnicalChallengeEvent | null {
    return queue.events[0] ?? null;
}

export function pop(
    queue: TechnicalChallengeEventQueue
): TechnicalChallengeEvent | null {
    if (queue.events.length === 0) return null;
    if (queue.events.length === 1) {
        delete queue.indices[queue.events[0]!.technicalChallengeId];
        return queue.events.pop()!;
    }

    const min = queue.events[0]!;
    delete queue.indices[min.technicalChallengeId];

    queue.events[0] = queue.events.pop()!;
    queue.indices[queue.events[0].technicalChallengeId] = 0;
    bubbleDown(queue, 0);

    return min;
}

export function remove(
    queue: TechnicalChallengeEventQueue,
    id: TechnicalChallengeId
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
    queue: TechnicalChallengeEventQueue,
    id: TechnicalChallengeId,
    updates: Partial<TechnicalChallengeEvent>
): boolean {
    const index = queue.indices[id];
    if (index === undefined) return false;

    const smaller: boolean | null =
        updates.timestamp === undefined
            ? null
            : updates.timestamp < queue.events[index]!.timestamp;

    queue.events[index] = { ...queue.events[index]!, ...updates };

    switch (smaller) {
        case null:
            break;
        case true:
            bubbleUp(queue, index);
            break;
        case false:
            bubbleDown(queue, index);
            break;
    }

    return true;
}

function swap(queue: TechnicalChallengeEventQueue, i: number, j: number) {
    const tmp = queue.events[i]!;
    queue.events[i] = queue.events[j]!;
    queue.events[j] = tmp;

    queue.indices[queue.events[i].technicalChallengeId] = i;
    queue.indices[queue.events[j].technicalChallengeId] = j;
}

function bubbleUp(queue: TechnicalChallengeEventQueue, index: number) {
    let current = index;
    while (current > 0) {
        const parent = Math.floor((current - 1) / 2);
        if (queue.events[current]!.timestamp >= queue.events[parent]!.timestamp)
            break;

        swap(queue, current, parent);
        current = parent;
    }
}

function bubbleDown(queue: TechnicalChallengeEventQueue, index: number) {
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
