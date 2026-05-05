import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface Scoutable {
    name?: string;
    viewedByParticipants?: boolean;
}
export const extendScoutables54: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        if (typedAction.type === '[Scoutable] Make scoutable') {
            const typedScoutableAction = action as {
                scoutable: Scoutable;
            };
            typedScoutableAction.scoutable.name = '';
            typedScoutableAction.scoutable.viewedByParticipants = false;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            scoutables: { [key in UUID]: Scoutable };
        };

        Object.values(typedState.scoutables).forEach((scoutable) => {
            scoutable.name = '';
            scoutable.viewedByParticipants = false;
        });
    },
};
