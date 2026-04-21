import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const replacePositionWithMetaPosition18: Migration = {
    action: (_intermediaryState, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            const typedAction = action as {
                patient: {
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
            };
            if (typedAction.patient.metaPosition?.type === 'coordinates') {
                typedAction.patient.metaPosition.coordinates =
                    typedAction.patient.metaPosition.position;
                delete typedAction.patient.metaPosition.position;
            }
            typedAction.patient.position = typedAction.patient.metaPosition;
            delete typedAction.patient.metaPosition;
        }
        if ((action as { type: string }).type === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicle: {
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
                materials: {
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                }[];
                personnel: {
                    transfer?: any;
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                }[];
            };
            for (const material of typedAction.materials) {
                if (material.metaPosition?.type === 'coordinates') {
                    material.metaPosition.coordinates =
                        material.metaPosition.position;
                    delete material.metaPosition.position;
                }
                material.position = material.metaPosition;
                delete material.metaPosition;
            }

            for (const personnel of typedAction.personnel) {
                delete personnel.transfer;
                if (personnel.metaPosition?.type === 'coordinates') {
                    personnel.metaPosition.coordinates =
                        personnel.metaPosition.position;
                    delete personnel.metaPosition.position;
                }
                personnel.position = personnel.metaPosition;
                delete personnel.metaPosition;
            }

            if (typedAction.vehicle.metaPosition?.type === 'coordinates') {
                typedAction.vehicle.metaPosition.coordinates =
                    typedAction.vehicle.metaPosition.position;
                delete typedAction.vehicle.metaPosition.position;
            }
            typedAction.vehicle.position = typedAction.vehicle.metaPosition;
            delete typedAction.vehicle.metaPosition;
        }
        if ((action as { type: string }).type === '[Viewport] Add viewport') {
            const typedAction = action as {
                viewport: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            typedAction.viewport.position = {
                type: 'coordinates',
                coordinates: {
                    x: (
                        typedAction.viewport.position as {
                            x: number;
                            y: number;
                        }
                    ).x,
                    y: (
                        typedAction.viewport.position as {
                            x: number;
                            y: number;
                        }
                    ).y,
                },
            };
        }
        if (
            (action as { type: string }).type ===
            '[SimulatedRegion] Add simulated region'
        ) {
            const typedAction = action as {
                simulatedRegion: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            typedAction.simulatedRegion.position = {
                type: 'coordinates',
                coordinates: {
                    x: (
                        typedAction.simulatedRegion.position as {
                            x: number;
                            y: number;
                        }
                    ).x,
                    y: (
                        typedAction.simulatedRegion.position as {
                            x: number;
                            y: number;
                        }
                    ).y,
                },
            };
        }
        if ((action as { type: string }).type === '[MapImage] Add MapImage') {
            const typedAction = action as {
                mapImage: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            typedAction.mapImage.position = {
                type: 'coordinates',
                coordinates: {
                    x: (
                        typedAction.mapImage.position as {
                            x: number;
                            y: number;
                        }
                    ).x,
                    y: (
                        typedAction.mapImage.position as {
                            x: number;
                            y: number;
                        }
                    ).y,
                },
            };
        }
        if (
            (action as { type: string }).type ===
            '[TransferPoint] Add TransferPoint'
        ) {
            const typedAction = action as {
                transferPoint: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            typedAction.transferPoint.position = {
                type: 'coordinates',
                coordinates: {
                    x: (
                        typedAction.transferPoint.position as {
                            x: number;
                            y: number;
                        }
                    ).x,
                    y: (
                        typedAction.transferPoint.position as {
                            x: number;
                            y: number;
                        }
                    ).y,
                },
            };
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: {
                [patientId: UUID]: {
                    vehicleId?: any;
                    transfer?: any;
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
            };
            materials: {
                [materialId: UUID]: {
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
            };
            vehicles: {
                [vehicleId: UUID]: {
                    transfer?: any;
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
            };
            personnel: {
                [personnelId: UUID]: {
                    transfer?: any;
                    metaPosition?:
                        | any
                        | { type: 'coordinates'; position: any }
                        | { type: any };
                    position: any;
                };
            };
            viewports: {
                [viewportId: UUID]: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            simulatedRegions: {
                [simulatedRegionId: UUID]: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            mapImages: {
                [simulatedRegionId: UUID]: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
            transferPoints: {
                [simulatedRegionId: UUID]: {
                    position:
                        | {
                              type: 'coordinates';
                              coordinates: { x: number; y: number };
                          }
                        | { x: number; y: number };
                };
            };
        };

        Object.values(typedState.patients).forEach((patient) => {
            delete patient.transfer;
            delete patient.vehicleId;
            if (patient.metaPosition?.type === 'coordinates') {
                patient.metaPosition.coordinates =
                    patient.metaPosition.position;
                delete patient.metaPosition.position;
            }
            patient.position = patient.metaPosition;
            delete patient.metaPosition;
        });

        Object.values(typedState.materials).forEach((material) => {
            if (material.metaPosition?.type === 'coordinates') {
                material.metaPosition.coordinates =
                    material.metaPosition.position;
                delete material.metaPosition.position;
            }
            material.position = material.metaPosition;
            delete material.metaPosition;
        });

        Object.values(typedState.vehicles).forEach((vehicle) => {
            delete vehicle.transfer;

            if (vehicle.metaPosition?.type === 'coordinates') {
                vehicle.metaPosition.coordinates =
                    vehicle.metaPosition.position;
                delete vehicle.metaPosition.position;
            }
            vehicle.position = vehicle.metaPosition;
            delete vehicle.metaPosition;
        });

        Object.values(typedState.personnel).forEach((personnel) => {
            delete personnel.transfer;
            if (personnel.metaPosition?.type === 'coordinates') {
                personnel.metaPosition.coordinates =
                    personnel.metaPosition.position;
                delete personnel.metaPosition.position;
            }
            personnel.position = personnel.metaPosition;
            delete personnel.metaPosition;
        });
        Object.values(typedState.viewports).forEach((viewport) => {
            viewport.position = {
                type: 'coordinates',
                coordinates: {
                    x: (viewport.position as { x: number; y: number }).x,
                    y: (viewport.position as { x: number; y: number }).y,
                },
            };
        });
        Object.values(typedState.simulatedRegions).forEach(
            (simulatedRegion) => {
                simulatedRegion.position = {
                    type: 'coordinates',
                    coordinates: {
                        x: (
                            simulatedRegion.position as { x: number; y: number }
                        ).x,
                        y: (
                            simulatedRegion.position as { x: number; y: number }
                        ).y,
                    },
                };
            }
        );
        Object.values(typedState.mapImages).forEach((mapImage) => {
            mapImage.position = {
                type: 'coordinates',
                coordinates: {
                    x: (mapImage.position as { x: number; y: number }).x,
                    y: (mapImage.position as { x: number; y: number }).y,
                },
            };
        });
        Object.values(typedState.transferPoints).forEach((transferPoint) => {
            transferPoint.position = {
                type: 'coordinates',
                coordinates: {
                    x: (transferPoint.position as { x: number; y: number }).x,
                    y: (transferPoint.position as { x: number; y: number }).y,
                },
            };
        });
    },
};
