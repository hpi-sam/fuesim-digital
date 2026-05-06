import type { WritableDraft } from 'immer';
import { nextUUID } from '../simulation/utils/randomness.js';
import { arrayToUUIDSet } from '../utils/array-to-uuid-set.js';
import { uuid, type UUID } from '../utils/uuid.js';
import { ReducerError } from '../store/reducer-error.js';
import type { VehicleTemplate } from '../models/vehicle-template.js';
import type { Migration } from './migration-functions.js';

interface VehicleParameters {
    vehicle?: Vehicle;
    materials?: Material[];
    personnel?: Personnel[];
}

interface ImageProperties {
    url: string;
}
type Position = MapPosition | VehiclePosition;

interface MapPosition {
    type: 'coordinates';
    coordinates: { x: number; y: number };
}

interface VehiclePosition {
    type: 'vehicle';
    vehicleId: UUID;
}

interface UUIDSet {
    readonly [x: string]: true;
}

interface CanCaterFor {
    red: number;
    yellow: number;
    green: number;
}

type MaterialType = 'big' | 'standard';

interface MaterialTemplate {
    type: 'materialTemplate';
    materialType: MaterialType;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    image: ImageProperties;
}

interface Material {
    id: UUID;
    type: 'material';
    vehicleId: UUID;
    vehicleName: string;
    assignedPatientIds: UUIDSet;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    position: Position;
    image: ImageProperties;
}

interface PersonnelTemplate {
    type: 'personnelTemplate';
    personnelType: string;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    image: ImageProperties;
}

interface Personnel {
    id: UUID;
    type: 'personnel';
    vehicleId: UUID;
    personnelType: string;
    vehicleName: string;
    assignedPatientIds: UUIDSet;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    image: ImageProperties;
    position: Position;
}

interface Vehicle {
    id: UUID;
    type: 'vehicle';
    vehicleType: string;
    name: string;
    materialIds: UUIDSet;
    patientCapacity: number;
    position: Position;
    image: ImageProperties;
    personnelIds: UUIDSet;
    patientIds: UUIDSet;
    occupation: { type: 'noOccupation' };
}

function createMaterial(
    materialTemplate: MaterialTemplate,
    vehicleId: UUID,
    vehicleName: string,
    position: Position
): Material {
    return {
        id: uuid(),
        type: 'material',
        vehicleId,
        vehicleName,
        assignedPatientIds: {},
        canCaterFor: materialTemplate.canCaterFor,
        overrideTreatmentRange: materialTemplate.overrideTreatmentRange,
        treatmentRange: materialTemplate.treatmentRange,
        position,
        image: materialTemplate.image,
    };
}

function createPersonnel(
    personnelTemplate: PersonnelTemplate,
    vehicleId: UUID,
    vehicleName: string,
    position: Position
): Personnel {
    return {
        id: uuid(),
        type: 'personnel',
        vehicleId,
        personnelType: personnelTemplate.personnelType,
        vehicleName,
        assignedPatientIds: {},
        canCaterFor: personnelTemplate.canCaterFor,
        overrideTreatmentRange: personnelTemplate.overrideTreatmentRange,
        treatmentRange: personnelTemplate.treatmentRange,
        image: personnelTemplate.image,
        position,
    };
}

function createVehicleParameters(
    vehicleId: UUID,
    vehicleTemplate: VehicleTemplate,
    materialTemplates: {
        [Key in UUID]: MaterialTemplate;
    },
    personnelTemplates: {
        [Key in UUID]: PersonnelTemplate;
    }
): VehicleParameters {
    const materials = vehicleTemplate.materialTemplateIds.map(
        (materialTemplateId) =>
            createMaterial(
                materialTemplates[materialTemplateId]!,
                vehicleId,
                vehicleTemplate.name,
                { type: 'vehicle', vehicleId }
            )
    );
    const personnel = vehicleTemplate.personnelTemplateIds.map(
        (personnelTemplateId) =>
            createPersonnel(
                personnelTemplates[personnelTemplateId]!,
                vehicleId,
                vehicleTemplate.name,
                { type: 'vehicle', vehicleId }
            )
    );

    const vehicle: Vehicle = {
        id: vehicleId,
        type: 'vehicle',
        materialIds: arrayToUUIDSet(materials.map((m) => m.id)),
        vehicleType: vehicleTemplate.vehicleType,
        name: vehicleTemplate.name,
        patientCapacity: vehicleTemplate.patientCapacity,
        image: vehicleTemplate.image,
        patientIds: {},
        personnelIds: arrayToUUIDSet(personnel.map((p) => p.id)),
        position: { type: 'coordinates', coordinates: { x: 0, y: 0 } },
        occupation: { type: 'noOccupation' },
    };

    return { vehicle, materials, personnel };
}

export const deterministicAlarmGroups38: Migration = {
    action: (intermediaryState, action) => {
        const typedState = intermediaryState as {
            vehicleTemplates: {
                [key in UUID]: VehicleTemplate;
            };
            personnelTemplates: {
                [key in UUID]: PersonnelTemplate;
            };
            materialTemplates: {
                [key in UUID]: MaterialTemplate;
            };
            alarmGroups: {
                [key in UUID]: {
                    alarmGroupVehicles: {
                        [vehicleKey in UUID]: {
                            id: UUID;
                            vehicleTemplateId: UUID;
                            name: string;
                            time: number;
                        };
                    };
                };
            };
        };

        switch ((action as { type: string }).type) {
            case '[Vehicle] Add vehicle': {
                const typedAction = action as VehicleParameters & {
                    vehicleParameters: VehicleParameters;
                };

                typedAction.vehicleParameters = {
                    vehicle: typedAction.vehicle,
                    materials: typedAction.materials,
                    personnel: typedAction.personnel,
                };

                delete typedAction.vehicle;
                delete typedAction.materials;
                delete typedAction.personnel;

                break;
            }
            case '[Emergency Operation Center] Send Alarm Group': {
                const typedAction = action as {
                    alarmGroupId: UUID;
                    sortedVehicleParameters: VehicleParameters[];
                    firstVehiclesCount: number;
                    firstVehiclesTargetTransferPointId: UUID | undefined;
                };

                const alarmGroup =
                    typedState.alarmGroups[typedAction.alarmGroupId];

                if (!alarmGroup) {
                    throw new ReducerError(
                        `Alarm group with id ${typedAction.alarmGroupId} does not exist`
                    );
                }

                const alarmGroupVehicles = Object.values(
                    alarmGroup.alarmGroupVehicles as {
                        [key: UUID]: {
                            id: UUID;
                            vehicleTemplateId: UUID;
                            name: string;
                            time: number;
                        };
                    }
                );

                // Build personnel templates and material templates from current state as state version 38
                const personnelTemplates = Object.fromEntries(
                    Object.values(typedState.personnelTemplates).map(
                        (template) => [
                            // @ts-expect-error - We needed to manually type this,
                            // please check the history of this file for more context
                            template.id,
                            {
                                personnelType: template.personnelType,
                                type: template.type,
                                canCaterFor: template.canCaterFor,
                                overrideTreatmentRange:
                                    template.overrideTreatmentRange,
                                treatmentRange: template.treatmentRange,
                                image: template.image,
                            } satisfies PersonnelTemplate,
                        ]
                    )
                );

                const materialTemplates = Object.fromEntries(
                    Object.values(typedState.materialTemplates).map(
                        (template) => {
                            const materialType: MaterialType =
                                template.image.url === '/assets/material.svg'
                                    ? 'standard'
                                    : 'big';
                            return [
                                // @ts-expect-error - We needed to manually type this,
                                // please check the history of this file for more context
                                template.id,
                                {
                                    materialType,
                                    type: template.type,
                                    canCaterFor: template.canCaterFor,
                                    overrideTreatmentRange:
                                        template.overrideTreatmentRange,
                                    treatmentRange: template.treatmentRange,
                                    image: template.image,
                                } satisfies MaterialTemplate,
                            ];
                        }
                    )
                );

                // We're trying to restore the original vehicle IDs that were generated with `nextUUID`.
                // Therefore, we must create them in the same order as the original code, i. e., only
                // sort by time if we have a different destination for the first vehicles
                if (
                    typedAction.firstVehiclesCount > 0 &&
                    typedAction.firstVehiclesTargetTransferPointId
                ) {
                    alarmGroupVehicles.sort((a, b) => a.time - b.time);
                }

                const vehicleIds = Object.fromEntries(
                    alarmGroupVehicles.map((alarmGroupVehicle) => [
                        alarmGroupVehicle.id,
                        nextUUID(intermediaryState as WritableDraft<any>),
                    ])
                );

                // However, the new action expects the vehicles to be always sorted.
                // So now, we sort again and can then draw the IDs from our map
                alarmGroupVehicles.sort((a, b) => a.time - b.time);

                const sortedVehicleParameters = alarmGroupVehicles.map(
                    (alarmGroupVehicle) =>
                        createVehicleParameters(
                            vehicleIds[alarmGroupVehicle.id]!,
                            {
                                ...typedState.vehicleTemplates[
                                    alarmGroupVehicle.vehicleTemplateId
                                ]!,
                                name: alarmGroupVehicle.name,
                            },
                            materialTemplates,
                            personnelTemplates
                        )
                );

                typedAction.sortedVehicleParameters = sortedVehicleParameters;

                break;
            }
        }
        return true;
    },
    state: null,
};
