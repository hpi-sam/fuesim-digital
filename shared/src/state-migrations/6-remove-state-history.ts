import type { Action } from '../store/action-reducer.js';
import type { Migration } from './migration-functions.js';

export const removeStateHistory6: Migration = {
    action: (_intermediaryState, action) => {
        const actionType = (action as Action).type;
        if (
            actionType === '[Exercise] Pause' ||
            actionType === '[Exercise] Start'
        ) {
            delete (action as { timestamp?: number }).timestamp;
        }
        return true;
    },
    state: (state) => {
        interface StatusHistoryEntry {
            status: 'paused' | 'running';
        }
        const oldState = state as { statusHistory?: StatusHistoryEntry[] };
        const currentStatus =
            oldState.statusHistory?.[oldState.statusHistory.length - 1]
                ?.status ?? 'notStarted';
        delete oldState.statusHistory;
        (
            state as { currentStatus: 'notStarted' | 'paused' | 'running' }
        ).currentStatus = currentStatus;
    },
};
