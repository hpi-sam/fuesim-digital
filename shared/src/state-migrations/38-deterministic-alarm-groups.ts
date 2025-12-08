import { nextUUID } from '../simulation/utils/randomness.js';
import type { ExerciseState } from '../state.js';
import { getElement } from '../store/action-reducers/utils/index.js';
import { arrayToUUIDSet } from '../utils/array-to-uuid-set.js';
import type { Mutable, UUID } from '../utils/index.js';
import { uuid } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

interface VehicleParameters {
    vehicle?: Vehicle;
    materials?: Material[];
    personnel?: Personnel[];
}

type ImagePropertiesStub = unknown;

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
    image: ImagePropertiesStub;
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
    image: ImagePropertiesStub;
}

type PersonnelType = 'gf' | 'notarzt' | 'notSan' | 'rettSan' | 'san';

interface PersonnelTemplate {
    type: 'personnelTemplate';
    personnelType: PersonnelType;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    image: ImagePropertiesStub;
}

interface Personnel {
    id: UUID;
    type: 'personnel';
    vehicleId: UUID;
    personnelType: PersonnelType;
    vehicleName: string;
    assignedPatientIds: UUIDSet;
    canCaterFor: CanCaterFor;
    overrideTreatmentRange: number;
    treatmentRange: number;
    image: ImagePropertiesStub;
    position: Position;
}

interface VehicleTemplate {
    id: UUID;
    type: 'vehicleTemplate';
    vehicleType: string;
    name: string;
    image: ImagePropertiesStub;
    patientCapacity: number;
    personnel: PersonnelType[];
    materials: MaterialType[];
}

interface Vehicle {
    id: UUID;
    type: 'vehicle';
    vehicleType: string;
    name: string;
    materialIds: UUIDSet;
    patientCapacity: number;
    position: Position;
    image: ImagePropertiesStub;
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
        [Key in MaterialType]: MaterialTemplate;
    },
    personnelTemplates: {
        [Key in PersonnelType]: PersonnelTemplate;
    }
): VehicleParameters {
    const materials = vehicleTemplate.materials.map((currentMaterial) =>
        createMaterial(
            materialTemplates[currentMaterial],
            vehicleId,
            vehicleTemplate.name,
            { type: 'vehicle', vehicleId }
        )
    );
    const personnel = vehicleTemplate.personnel.map((currentPersonnel) =>
        createPersonnel(
            personnelTemplates[currentPersonnel],
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
                const typedState = intermediaryState as {
                    materialTemplates: {
                        [Key in MaterialType]: MaterialTemplate;
                    };
                    personnelTemplates: {
                        [Key in PersonnelType]: PersonnelTemplate;
                    };
                    vehicleTemplates: VehicleTemplate[];
                };

                const alarmGroup = getElement(
                    intermediaryState as any,
                    'alarmGroup',
                    typedAction.alarmGroupId
                );

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

                const vehicleTemplatesById = Object.fromEntries(
                    typedState.vehicleTemplates.map((template) => [
                        template.id,
                        template,
                    ])
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
                        nextUUID(intermediaryState as Mutable<ExerciseState>),
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
                                ...vehicleTemplatesById[
                                    alarmGroupVehicle.vehicleTemplateId
                                ]!,
                                name: alarmGroupVehicle.name,
                            },
                            typedState.materialTemplates,
                            typedState.personnelTemplates
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
