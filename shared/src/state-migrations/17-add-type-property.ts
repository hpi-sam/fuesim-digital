import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addTypeProperty17: Migration = {
    action: (_intermediaryState, action) => {
        const actionType = (action as { type: string }).type;

        if (actionType === '[AlarmGroup] Add AlarmGroup') {
            const typedAction = action as {
                alarmGroup: {
                    type: 'alarmGroup';
                };
            };

            typedAction.alarmGroup.type = 'alarmGroup';
        }

        if (actionType === '[Client] Add client') {
            const typedAction = action as {
                client: {
                    type: 'client';
                };
            };

            typedAction.client.type = 'client';
        }

        if (actionType === '[Hospital] Add hospital') {
            const typedAction = action as {
                hospital: {
                    type: 'hospital';
                };
            };

            typedAction.hospital.type = 'hospital';
        }

        if (actionType === '[MapImageTemplate] Add mapImageTemplate') {
            const typedAction = action as {
                mapImageTemplate: {
                    type: 'mapImageTemplate';
                };
            };

            typedAction.mapImageTemplate.type = 'mapImageTemplate';
        }

        if (actionType === '[MapImage] Add MapImage') {
            const typedAction = action as {
                mapImage: {
                    type: 'mapImage';
                };
            };

            typedAction.mapImage.type = 'mapImage';
        }

        if (actionType === '[Patient] Add patient') {
            const typedAction = action as {
                patient: {
                    type: 'patient';
                    healthStates: {
                        [key: UUID]: { type: 'patientHealthState' };
                    };
                };
            };

            typedAction.patient.type = 'patient';
            Object.values(typedAction.patient.healthStates).forEach(
                (healthState) => {
                    healthState.type = 'patientHealthState';
                }
            );
        }

        if (actionType === '[SimulatedRegion] Add simulated region') {
            const typedAction = action as {
                simulatedRegion: {
                    type: 'simulatedRegion';
                };
            };

            typedAction.simulatedRegion.type = 'simulatedRegion';
        }

        if (
            actionType === '[Transfer] Add to transfer' ||
            actionType === '[Transfer] Edit transfer' ||
            actionType === '[Transfer] Finish transfer' ||
            actionType === '[Transfer] Toggle pause transfer'
        ) {
            const typedAction = action as {
                elementType: 'personnel' | 'vehicle' | 'vehicles';
            };

            if (typedAction.elementType === 'vehicles') {
                typedAction.elementType = 'vehicle';
            }
        }

        if (actionType === '[TransferPoint] Add TransferPoint') {
            const typedAction = action as {
                transferPoint: {
                    type: 'transferPoint';
                };
            };

            typedAction.transferPoint.type = 'transferPoint';
        }

        if (actionType === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicle: {
                    type: 'vehicle';
                };
                materials: { type: 'material' }[];
                personnel: { type: 'personnel' }[];
            };

            typedAction.vehicle.type = 'vehicle';
            typedAction.materials.forEach((material) => {
                material.type = 'material';
            });
            typedAction.personnel.forEach((personnel) => {
                personnel.type = 'personnel';
            });
        }

        if (actionType === '[Vehicle] Load vehicle') {
            const typedAction = action as {
                elementToBeLoadedType:
                    | 'material'
                    | 'materials'
                    | 'patient'
                    | 'patients'
                    | 'personnel';
            };

            if (typedAction.elementToBeLoadedType === 'materials') {
                typedAction.elementToBeLoadedType = 'material';
            } else if (typedAction.elementToBeLoadedType === 'patients') {
                typedAction.elementToBeLoadedType = 'patient';
            }
        }

        if (actionType === '[Viewport] Add viewport') {
            const typedAction = action as {
                viewport: {
                    type: 'viewport';
                };
            };

            typedAction.viewport.type = 'viewport';
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            alarmGroups: {
                [key: UUID]: {
                    type: 'alarmGroup';
                };
            };
            clients: {
                [key: UUID]: {
                    type: 'client';
                };
            };
            eocLog: { type: 'eocLogEntry' }[];
            configuration: { type: 'exerciseConfiguration' };
            hospitalPatients: {
                [key: UUID]: {
                    type: 'hospitalPatient';
                };
            };
            hospitals: {
                [key: UUID]: {
                    type: 'hospital';
                };
            };
            mapImageTemplates: { type: 'mapImageTemplate' }[];
            mapImages: {
                [key: UUID]: {
                    type: 'mapImage';
                };
            };
            materialTemplates: { type: 'materialTemplate' }[];
            materials: {
                [key: UUID]: {
                    type: 'material';
                };
            };
            patientCategories: {
                type: 'patientCategory';
                patientTemplates: { type: 'patientTemplate' }[];
            }[];
            patients: {
                [key: UUID]: {
                    type: 'patient';
                    healthStates: {
                        [key: UUID]: { type: 'patientHealthState' };
                    };
                };
            };
            personnelTemplates: { type: 'personnelTemplate' }[];
            personnel: {
                [key: UUID]: {
                    type: 'personnel';
                };
            };
            simulatedRegions: {
                [key: UUID]: {
                    type: 'simulatedRegion';
                };
            };
            transferPoints: {
                [key: UUID]: {
                    type: 'transferPoint';
                };
            };
            vehicleTemplates: { type: 'vehicleTemplate' }[];
            vehicles: {
                [key: UUID]: {
                    type: 'vehicle';
                };
            };
            viewports: {
                [key: UUID]: {
                    type: 'viewport';
                };
            };
        };

        Object.values(typedState.alarmGroups).forEach((alarmGroup) => {
            alarmGroup.type = 'alarmGroup';
        });

        Object.values(typedState.clients).forEach((client) => {
            client.type = 'client';
        });

        Object.values(typedState.eocLog).forEach((logEntry) => {
            logEntry.type = 'eocLogEntry';
        });

        typedState.configuration.type = 'exerciseConfiguration';

        Object.values(typedState.hospitalPatients).forEach(
            (hospitalPatient) => {
                hospitalPatient.type = 'hospitalPatient';
            }
        );

        Object.values(typedState.hospitals).forEach((hospital) => {
            hospital.type = 'hospital';
        });

        Object.values(typedState.mapImageTemplates).forEach(
            (mapImageTemplate) => {
                mapImageTemplate.type = 'mapImageTemplate';
            }
        );

        Object.values(typedState.mapImages).forEach((mapImage) => {
            mapImage.type = 'mapImage';
        });

        Object.values(typedState.materialTemplates).forEach(
            (materialTemplate) => {
                materialTemplate.type = 'materialTemplate';
            }
        );

        Object.values(typedState.materials).forEach((material) => {
            material.type = 'material';
        });

        Object.values(typedState.patientCategories).forEach(
            (patientCategory) => {
                patientCategory.type = 'patientCategory';
                patientCategory.patientTemplates.forEach((patientTemplate) => {
                    patientTemplate.type = 'patientTemplate';
                });
            }
        );

        Object.values(typedState.patients).forEach((patient) => {
            patient.type = 'patient';
            Object.values(patient.healthStates).forEach((healthState) => {
                healthState.type = 'patientHealthState';
            });
        });

        Object.values(typedState.personnelTemplates).forEach(
            (personnelTemplates) => {
                personnelTemplates.type = 'personnelTemplate';
            }
        );

        Object.values(typedState.personnel).forEach((personnel) => {
            personnel.type = 'personnel';
        });

        Object.values(typedState.simulatedRegions).forEach(
            (simulatedRegion) => {
                simulatedRegion.type = 'simulatedRegion';
            }
        );

        Object.values(typedState.transferPoints).forEach((transferPoint) => {
            transferPoint.type = 'transferPoint';
        });

        Object.values(typedState.vehicleTemplates).forEach(
            (vehicleTemplate) => {
                vehicleTemplate.type = 'vehicleTemplate';
            }
        );

        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.type = 'vehicle';
        });

        Object.values(typedState.viewports).forEach((viewport) => {
            viewport.type = 'viewport';
        });
    },
};
