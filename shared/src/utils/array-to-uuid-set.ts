import type { WritableDraft } from 'immer';
import type { UUID, UUIDSet } from './index.js';

export function arrayToUUIDSet(uuids: ReadonlyArray<UUID>) {
    const set: WritableDraft<UUIDSet> = {};
    for (const uuid of uuids) {
        set[uuid] = true;
    }
    return set;
}
