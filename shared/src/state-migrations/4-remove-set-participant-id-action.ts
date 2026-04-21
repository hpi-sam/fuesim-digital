import type { Action } from '../store/action-reducer.js';
import type { Migration } from './migration-functions.js';

export const removeSetParticipantIdAction4: Migration = {
    action: (_intermediaryState, action) =>
        (action as Action).type !== '[Exercise] Set Participant Id',
    state: null,
};
