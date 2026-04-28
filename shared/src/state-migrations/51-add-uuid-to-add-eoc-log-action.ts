import type { UUID } from '../utils/uuid.js';
import { uuid } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addUUIDtoAddEocLogEntryAction51: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Emergency Operation Center] Add Log Entry': {
                const typedLogAction = action as { id: UUID };
                typedLogAction.id = uuid();
                break;
            }
            case '[Emergency Operation Center] Send Alarm Group': {
                const typedAlarmAction = action as { eocLogId: UUID };
                typedAlarmAction.eocLogId = uuid();
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: null,
};
