import type { Migration } from './migration-functions.js';

function migrateAlarmGroup(alarmGroup: {
    sent: boolean | undefined;
    triggerLimit: number | null | undefined;
    triggerCount: number | undefined;
}) {
    alarmGroup.triggerLimit = null;
    alarmGroup.triggerCount = alarmGroup.sent ? 1 : 0;

    delete alarmGroup.sent;
}

export const limitedAlarmgroups46: Migration = {
    action: (_intermediaryState, action) => {
        switch ((action as { type: string }).type) {
            case '[AlarmGroup] Add AlarmGroup': {
                const typedAction = action as {
                    alarmGroup: {
                        triggerLimit: number | null | undefined;
                        triggerCount: number | undefined;
                        sent: boolean | undefined;
                    };
                };

                migrateAlarmGroup(typedAction.alarmGroup);
            }
        }
        return true;
    },

    state: (state) => {
        const typedState = state as {
            alarmGroups: {
                [alarmGroupId: string]: {
                    triggerLimit: number | null | undefined;
                    triggerCount: number | undefined;
                    sent: boolean | undefined;
                };
            };
        };

        Object.values(typedState.alarmGroups).forEach((alarmGroup) => {
            migrateAlarmGroup(alarmGroup);
        });
    },
};
