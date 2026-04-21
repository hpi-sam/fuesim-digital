import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const renameStartPointTypes19: Migration = {
    action: (_intermediaryState, action) => {
        if (
            (action as { type: string }).type === '[Transfer] Add to transfer'
        ) {
            const typedAction = action as {
                startPoint: {
                    type:
                        | 'alarmGroup'
                        | 'alarmGroupStartPoint'
                        | 'transferPoint'
                        | 'transferStartPoint';
                };
            };
            if (typedAction.startPoint.type === 'alarmGroup') {
                typedAction.startPoint.type = 'alarmGroupStartPoint';
            } else if (typedAction.startPoint.type === 'transferPoint') {
                typedAction.startPoint.type = 'transferStartPoint';
            }
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            materials: {
                [materialId: UUID]: {
                    position: {
                        type: 'transfer';
                        transfer: {
                            startPoint: {
                                type:
                                    | 'alarmGroup'
                                    | 'alarmGroupStartPoint'
                                    | 'transferPoint'
                                    | 'transferStartPoint';
                            };
                        };
                    };
                };
            };
            vehicles: {
                [vehicleId: UUID]: {
                    position: {
                        type: 'transfer';
                        transfer: {
                            startPoint: {
                                type:
                                    | 'alarmGroup'
                                    | 'alarmGroupStartPoint'
                                    | 'transferPoint'
                                    | 'transferStartPoint';
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
                            startPoint: {
                                type:
                                    | 'alarmGroup'
                                    | 'alarmGroupStartPoint'
                                    | 'transferPoint'
                                    | 'transferStartPoint';
                            };
                        };
                    };
                };
            };
        };

        Object.values(typedState.materials).forEach((material) => {
            // Disabled due to incomplete typings in the migration
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (material.position.type === 'transfer') {
                if (
                    material.position.transfer.startPoint.type === 'alarmGroup'
                ) {
                    material.position.transfer.startPoint.type =
                        'alarmGroupStartPoint';
                } else if (
                    material.position.transfer.startPoint.type ===
                    'transferPoint'
                ) {
                    material.position.transfer.startPoint.type =
                        'transferStartPoint';
                }
            }
        });

        Object.values(typedState.vehicles).forEach((vehicle) => {
            // Disabled due to incomplete typings in the migration
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (vehicle.position.type === 'transfer') {
                if (
                    vehicle.position.transfer.startPoint.type === 'alarmGroup'
                ) {
                    vehicle.position.transfer.startPoint.type =
                        'alarmGroupStartPoint';
                } else if (
                    vehicle.position.transfer.startPoint.type ===
                    'transferPoint'
                ) {
                    vehicle.position.transfer.startPoint.type =
                        'transferStartPoint';
                }
            }
        });

        Object.values(typedState.personnel).forEach((personnel) => {
            // Disabled due to incomplete typings in the migration
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (personnel.position.type === 'transfer') {
                if (
                    personnel.position.transfer.startPoint.type === 'alarmGroup'
                ) {
                    personnel.position.transfer.startPoint.type =
                        'alarmGroupStartPoint';
                } else if (
                    personnel.position.transfer.startPoint.type ===
                    'transferPoint'
                ) {
                    personnel.position.transfer.startPoint.type =
                        'transferStartPoint';
                }
            }
        });
    },
};
