import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface Scoutable {
    name?: string;
    viewedByParticipants?: boolean;
}

export const technicalChallengesMeasuresExtendedScoutables56: Migration = {
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
    state: (state: any) => {
        const typedState = state as {
            scoutables: { [key in UUID]: Scoutable };
        };

        state.technicalChallenges = {};
        state.taskTypes = {};
        state.measures = {};
        state.measureTemplates = {};
        state.drawings = {};

        Object.values(typedState.scoutables).forEach((scoutable) => {
            scoutable.name = '';
            scoutable.viewedByParticipants = false;
        });
    },
};
