import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addMetaPosition16: Migration = {
    action: (_intermediaryState, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            const typedAction = action as {
                patient: {
                    position?: { x: number; y: number };
                    vehicleId?: UUID;
                    metaPosition?: any;
                };
            };
            if (typedAction.patient.position) {
                typedAction.patient.metaPosition = {
                    type: 'coordinates',
                    position: {
                        x: typedAction.patient.position.x,
                        y: typedAction.patient.position.y,
                    },
                };
            } else if (typedAction.patient.vehicleId) {
                typedAction.patient.metaPosition = {
                    type: 'vehicle',
                    vehicleId: typedAction.patient.vehicleId,
                };
            }
        }
        if ((action as { type: string }).type === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicle: {
                    position?: { x: number; y: number };
                    transfer?: any;
                    metaPosition?: any;
                };
                materials: {
                    position?: { x: number; y: number };
                    vehicleId?: UUID;
                    metaPosition?: any;
                }[];
                personnel: {
                    position?: { x: number; y: number };
                    transfer?: any;
                    vehicleId?: UUID;
                    metaPosition?: any;
                }[];
            };
            if (typedAction.vehicle.position) {
                typedAction.vehicle.metaPosition = {
                    type: 'coordinates',
                    position: {
                        x: typedAction.vehicle.position.x,
                        y: typedAction.vehicle.position.y,
                    },
                };
            } else if (typedAction.vehicle.transfer) {
                typedAction.vehicle.metaPosition = {
                    type: 'transfer',
                    transfer: typedAction.vehicle.transfer,
                };
            } else {
                typedAction.vehicle.metaPosition = {
                    type: 'coordinates',
                    position: {
                        x: 0,
                        y: 0,
                    },
                };
            }
            for (const personnel of typedAction.personnel) {
                if (personnel.position) {
                    personnel.metaPosition = {
                        type: 'coordinates',
                        position: {
                            x: personnel.position.x,
                            y: personnel.position.y,
                        },
                    };
                } else if (personnel.transfer) {
                    personnel.metaPosition = {
                        type: 'transfer',
                        transfer: personnel.transfer,
                    };
                } else if (personnel.vehicleId) {
                    personnel.metaPosition = {
                        type: 'vehicle',
                        vehicleId: personnel.vehicleId,
                    };
                }
            }

            for (const material of typedAction.materials) {
                if (material.position) {
                    material.metaPosition = {
                        type: 'coordinates',
                        position: {
                            x: material.position.x,
                            y: material.position.y,
                        },
                    };
                } else if (material.vehicleId) {
                    material.metaPosition = {
                        type: 'vehicle',
                        vehicleId: material.vehicleId,
                    };
                }
            }
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: {
                [patientId: UUID]: {
                    position?: { x: number; y: number };
                    vehicleId?: UUID;
                    metaPosition?: any;
                };
            };
            materials: {
                [materialId: UUID]: {
                    position?: { x: number; y: number };
                    vehicleId?: UUID;
                    metaPosition?: any;
                };
            };
            vehicles: {
                [vehicleId: UUID]: {
                    position?: { x: number; y: number };
                    transfer?: any;
                    metaPosition?: any;
                };
            };
            personnel: {
                [personnelId: UUID]: {
                    position?: { x: number; y: number };
                    transfer?: any;
                    vehicleId?: UUID;
                    metaPosition?: any;
                };
            };
        };

        Object.values(typedState.patients).forEach((patient) => {
            if (patient.position) {
                patient.metaPosition = {
                    type: 'coordinates',
                    position: { x: patient.position.x, y: patient.position.y },
                };
            } else if (patient.vehicleId) {
                patient.metaPosition = {
                    type: 'vehicle',
                    vehicleId: patient.vehicleId,
                };
            }
        });

        Object.values(typedState.materials).forEach((material) => {
            if (material.position) {
                material.metaPosition = {
                    type: 'coordinates',
                    position: {
                        x: material.position.x,
                        y: material.position.y,
                    },
                };
            } else if (material.vehicleId) {
                material.metaPosition = {
                    type: 'vehicle',
                    vehicleId: material.vehicleId,
                };
            }
        });

        Object.values(typedState.vehicles).forEach((vehicle) => {
            if (vehicle.position) {
                vehicle.metaPosition = {
                    type: 'coordinates',
                    position: { x: vehicle.position.x, y: vehicle.position.y },
                };
            } else if (vehicle.transfer) {
                vehicle.metaPosition = {
                    type: 'transfer',
                    transfer: vehicle.transfer,
                };
            }
        });

        Object.values(typedState.personnel).forEach((personnel) => {
            if (personnel.position) {
                personnel.metaPosition = {
                    type: 'coordinates',
                    position: {
                        x: personnel.position.x,
                        y: personnel.position.y,
                    },
                };
            } else if (personnel.transfer) {
                personnel.metaPosition = {
                    type: 'transfer',
                    transfer: personnel.transfer,
                };
            } else if (personnel.vehicleId) {
                personnel.metaPosition = {
                    type: 'vehicle',
                    vehicleId: personnel.vehicleId,
                };
            }
        });
    },
};
