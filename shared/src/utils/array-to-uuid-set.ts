import type { WritableDraft } from 'immer';
import type { UUID } from './uuid.js';
import type { UUIDSet } from './uuid-set.js';

export function arrayToUUIDSet(uuids: ReadonlyArray<UUID>) {
    const set: WritableDraft<UUIDSet> = {};
    for (const uuid of uuids) {
        set[uuid] = true;
    }
    return set;
}
