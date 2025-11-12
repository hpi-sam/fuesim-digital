import type { Migration } from './migration-functions.js';

export const limitedAlarmgroups46: Migration = {
    action: (_intermediaryState, action) => {
        if (
            (action as { type: string }).type ===
            '[Emergency Operation Center] Add Log Entry'
        ) {
            const typedAction = action as {
                isPrivate?: boolean;
            };
            // We assume that the log entries were written by a
            // leader for notes on the running exercise and
            // therefore set them to private
            typedAction.isPrivate ??= true;
        }
        return true;
    },

    state: (state) => {
        const typedState = state as {
            alarmGroups: {
                [alarmGroupId: string]: {
                    triggerLimit: number | null | undefined;
                    triggerCount: number | undefined;
                };
            };
        };

        Object.values(typedState.alarmGroups).forEach((alarmGroup) => {
            if (alarmGroup.triggerLimit === undefined) {
                alarmGroup.triggerLimit = null;
            }

            alarmGroup.triggerCount ??= 0;
        });
    },
};
