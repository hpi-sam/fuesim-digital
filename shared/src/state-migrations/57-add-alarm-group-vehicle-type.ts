import type { Migration } from './migration-functions.js';

interface AlarmGroupVehicle {
    type: 'alarmGroupVehicle';
}

export const addAlarmGroupVehicleType57: Migration = {
    action: (_, action) => {
        const typedAction = action as {
            type: string | '[AlarmGroup] Add AlarmGroupVehicle';
            alarmGroupVehicle: AlarmGroupVehicle;
        };
        switch (typedAction.type) {
            case '[AlarmGroup] Add AlarmGroupVehicle': {
                typedAction.alarmGroupVehicle.type = 'alarmGroupVehicle';
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state: any) => {
        const typedState = state as {
            alarmGroups: {
                [uuid: string]: {
                    alarmGroupVehicles: {
                        [uuid: string]: AlarmGroupVehicle;
                    };
                };
            };
        };

        typedState.alarmGroups = Object.fromEntries(
            Object.entries(typedState.alarmGroups).map(([key, value]) => [
                key,
                {
                    ...value,
                    alarmGroupVehicles: Object.fromEntries(
                        Object.entries(value.alarmGroupVehicles).map(
                            ([key2, value2]) => [
                                key2,
                                {
                                    ...value2,
                                    type: 'alarmGroupVehicle',
                                },
                            ]
                        )
                    ),
                },
            ])
        );
    },
};
