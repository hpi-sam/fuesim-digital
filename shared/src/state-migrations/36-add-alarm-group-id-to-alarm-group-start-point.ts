/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// Disabled due to incomplete typings in the migration

import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addAlarmGroupIdToAlarmGroupStartPoint36: Migration = {
    action: (intermediaryState, action) => {
        if (
            (action as { type: string }).type === '[Transfer] Add to transfer'
        ) {
            const typedAction = action as {
                startPoint:
                    | AlarmGroupStartPointStub
                    | { type: Exclude<'alarmGroupStartPoint', unknown> };
            };

            if (typedAction.startPoint.type === 'alarmGroupStartPoint') {
                migrateAlarmGroupStartPoint(
                    typedAction.startPoint,
                    intermediaryState as StateStub
                );
            }
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            vehicles: {
                [vehicleId: UUID]: {
                    position: {
                        type: 'transfer';
                        transfer: {
                            startPoint:
                                | AlarmGroupStartPointStub
                                | {
                                      type: Exclude<
                                          'alarmGroupStartPoint',
                                          unknown
                                      >;
                                  };
                        };
                    };
                };
            };
            personnel: {
                [personnelId: UUID]: {
                    position: {
                        type: 'transfer';
                        transfer: {
                            startPoint:
                                | AlarmGroupStartPointStub
                                | {
                                      type: Exclude<
                                          'alarmGroupStartPoint',
                                          unknown
                                      >;
                                  };
                        };
                    };
                };
            };
        };

        Object.values(typedState.vehicles).forEach((vehicle) => {
            if (vehicle.position.type === 'transfer') {
                if (
                    vehicle.position.transfer.startPoint.type ===
                    'alarmGroupStartPoint'
                ) {
                    migrateAlarmGroupStartPoint(
                        vehicle.position.transfer.startPoint,
                        state as StateStub
                    );
                }
            }
        });

        Object.values(typedState.personnel).forEach((personnel) => {
            if (personnel.position.type === 'transfer') {
                if (
                    personnel.position.transfer.startPoint.type ===
                    'alarmGroupStartPoint'
                ) {
                    migrateAlarmGroupStartPoint(
                        personnel.position.transfer.startPoint,
                        state as StateStub
                    );
                }
            }
        });
    },
};

interface AlarmGroupStartPointStub {
    type: 'alarmGroupStartPoint';
    alarmGroupName?: string;
    alarmGroupId: UUID;
}

interface AlarmGroupStub {
    id: UUID;
    name: string;
}

interface StateStub {
    alarmGroups: { [key: UUID]: AlarmGroupStub };
}

function migrateAlarmGroupStartPoint(
    alarmGroupStartPoint: AlarmGroupStartPointStub,
    state: StateStub
) {
    alarmGroupStartPoint.alarmGroupId = Object.values(state.alarmGroups).find(
        (alarmGroup) => alarmGroup.name === alarmGroupStartPoint.alarmGroupName
    )!.id;
    delete alarmGroupStartPoint.alarmGroupName;
}
