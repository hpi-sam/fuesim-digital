import type { Migration } from './migration-functions.js';

export const removeSetParticipantIdAction4: Migration = {
    // INFO: This action migration used to remove the action
    // "[Exercise] Set Participant Id" which set the participantId in the state.
    //
    // HOWEVER, if we start with initialState.participantId = null (stateVersion <4),
    // the removal of this action will cause the participantId to remain null.
    // This causes a Validation Error.
    action: null,
    state: (state) => {
        const typedState = state as {
            participantId: string;
        };

        // on old exercises, the participantid may not yet be set.
        //
        // we assert a non-null participantId in initialState in newer versions
        //
        // since the initialState gets overwritten anyway, this should not cause any problems
        if (typedState.participantId.length === 0) {
            typedState.participantId = '000000';
        }

        return typedState;
    },
};
