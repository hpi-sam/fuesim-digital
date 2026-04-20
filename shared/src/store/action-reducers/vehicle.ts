import { IsString, IsUUID } from 'class-validator';
import { WritableDraft } from 'immer';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { newNoPosition } from '../../models/utils/position/no-position.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    currentCoordinatesOf,
    currentSimulatedRegionIdOf,
    currentSimulatedRegionOf,
    isInSimulatedRegion,
    isInSpecificSimulatedRegion,
    isInTransfer,
    isInVehicle,
    isOnMap,
} from '../../models/utils/position/position-helpers.js';
import { IsValue } from '../../utils/validators/is-value.js';
import {
    type VehicleParameters,
    vehicleParametersSchema,
} from '../../models/utils/vehicle-parameters.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from '../../models/utils/occupations/exercise-occupation.js';
import { newVehiclePositionIn } from '../../models/utils/position/vehicle-position.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { imageSizeToPosition } from '../../state-helpers/image-size-to-position.js';
import { newSimulatedRegionPositionIn } from '../../models/utils/position/simulated-region-position.js';
import { changeOccupation } from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newMaterialRemovedEvent } from '../../simulation/events/material-removed.js';
import { newPersonnelRemovedEvent } from '../../simulation/events/personnel-removed.js';
import { newVehicleRemovedEvent } from '../../simulation/events/vehicle-removed.js';
import { newNewPatientEvent } from '../../simulation/events/new-patient.js';
import { newPersonnelAvailableEvent } from '../../simulation/events/personnel-available.js';
import { newMaterialAvailableEvent } from '../../simulation/events/material-available.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';
import { deletePatient } from './patient.js';
import { completelyLoadVehicle as completelyLoadVehicleHelper } from './utils/completely-load-vehicle.js';
import { removeElementPosition } from './utils/spatial-elements.js';
import { logVehicleAdded, logVehicleRemoved } from './utils/log.js';
import { checkRestrictedVehicleMovementOrThrow } from './utils/restricted-vehicle-movement.js';
import { fillPositionAt } from './utils/operational-assignment-positions.js';

/**
 * Performs all necessary actions to remove a vehicle from the state.
 * This includes removing the material, personnel and (if there are some) patients and sending removed events for those elements if the vehicle is in a simulated region.
 * @param vehicleId The ID of the vehicle to be deleted
 */
export function deleteVehicle(
    draftState: WritableDraft<ExerciseState>,
    vehicleId: UUID
) {
    logVehicleRemoved(draftState, vehicleId);

    const vehicle = getElement(draftState, 'vehicle', vehicleId);

    // Delete related material and personnel
    Object.keys(vehicle.materialIds).forEach((materialId) => {
        const material = getElement(draftState, 'material', materialId);
        if (isInSimulatedRegion(material)) {
            const simulatedRegion = currentSimulatedRegionOf(
                draftState,
                material
            );
            sendSimulationEvent(
                simulatedRegion,
                newMaterialRemovedEvent(materialId)
            );
        }

        removeElementPosition(draftState, 'material', materialId);
        delete draftState.materials[materialId];
    });

    Object.keys(vehicle.personnelIds).forEach((personnelId) => {
        const personnel = getElement(draftState, 'personnel', personnelId);
        if (isInSimulatedRegion(personnel)) {
            const simulatedRegion = currentSimulatedRegionOf(
                draftState,
                personnel
            );
            sendSimulationEvent(
                simulatedRegion,
                newPersonnelRemovedEvent(personnelId)
            );
        }

        removeElementPosition(draftState, 'personnel', personnelId);
        delete draftState.personnel[personnelId];
    });

    Object.keys(vehicle.patientIds).forEach((patientId) => {
        // The PatientRemovedEvent will be sent by the function below, so we don't have to do it here
        deletePatient(draftState, patientId);
    });

    if (
        vehicle.operationalAssignment?.type === 'operationalSection' &&
        vehicle.operationalAssignment.role === 'operationalSectionMember'
    ) {
        fillPositionAt(
            draftState,
            vehicle.operationalAssignment.sectionId,
            vehicle.operationalAssignment.position
        );
    }

    if (isInSimulatedRegion(vehicle)) {
        const simulatedRegion = currentSimulatedRegionOf(draftState, vehicle);
        sendSimulationEvent(simulatedRegion, newVehicleRemovedEvent(vehicleId));
    }

    // Delete the vehicle
    delete draftState.vehicles[vehicleId];
}

export class AddVehicleAction implements Action {
    @IsValue('[Vehicle] Add vehicle' as const)
    public readonly type = '[Vehicle] Add vehicle';

    @IsZodSchema(vehicleParametersSchema)
    public readonly vehicleParameters!: VehicleParameters;
}

export class RenameVehicleAction implements Action {
    @IsValue('[Vehicle] Rename vehicle' as const)
    public readonly type = '[Vehicle] Rename vehicle';
    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsString()
    public readonly name!: string;
}

export class MoveVehicleAction implements Action {
    @IsValue('[Vehicle] Move vehicle' as const)
    public readonly type = '[Vehicle] Move vehicle';

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export class RemoveVehicleAction implements Action {
    @IsValue('[Vehicle] Remove vehicle' as const)
    public readonly type = '[Vehicle] Remove vehicle';
    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;
}

export class UnloadVehicleAction implements Action {
    @IsValue('[Vehicle] Unload vehicle' as const)
    public readonly type = '[Vehicle] Unload vehicle';
    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;
}

export class LoadVehicleAction implements Action {
    @IsValue('[Vehicle] Load vehicle' as const)
    public readonly type = '[Vehicle] Load vehicle';

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsLiteralUnion({
        material: true,
        patient: true,
        personnel: true,
    })
    public readonly elementToBeLoadedType!:
        | 'material'
        | 'patient'
        | 'personnel';

    @IsUUID(4, uuidValidationOptions)
    public readonly elementToBeLoadedId!: UUID;
}

export class CompletelyLoadVehicleAction implements Action {
    @IsValue('[Vehicle] Completely load vehicle' as const)
    public readonly type = '[Vehicle] Completely load vehicle';
    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;
}

export class RemoveVehicleFromSimulatedRegionAction implements Action {
    @IsValue('[Vehicle] Remove from simulated region' as const)
    public readonly type = '[Vehicle] Remove from simulated region';

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;
}

export class SetVehicleOccupationAction implements Action {
    @IsValue('[Vehicle] Set occupation' as const)
    public readonly type = '[Vehicle] Set occupation';

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsZodSchema(exerciseOccupationSchema)
    public readonly occupation!: ExerciseOccupation;
}

export namespace VehicleActionReducers {
    export const addVehicle: ActionReducer<AddVehicleAction> = {
        action: AddVehicleAction,
        reducer: (draftState, { vehicleParameters }) => {
            const { vehicle, materials, personnel } = vehicleParameters;
            if (
                materials.some(
                    (material) =>
                        material.vehicleId !== vehicle.id ||
                        vehicle.materialIds[material.id] === undefined
                ) ||
                TypeAssertedObject.keys(vehicle.materialIds).length !==
                    materials.length
            ) {
                throw new ReducerError(
                    'Vehicle material ids do not match material ids'
                );
            }
            if (
                personnel.some(
                    (currentPersonnel) =>
                        currentPersonnel.vehicleId !== vehicle.id ||
                        vehicle.personnelIds[currentPersonnel.id] === undefined
                ) ||
                TypeAssertedObject.keys(vehicle.personnelIds).length !==
                    personnel.length
            ) {
                throw new ReducerError(
                    'Vehicle personnel ids do not match personnel ids'
                );
            }

            checkRestrictedVehicleMovementOrThrow(
                draftState,
                vehicle,
                newNoPosition(),
                vehicle.position
            );

            draftState.vehicles[vehicle.id] = cloneDeepMutable(vehicle);
            for (const material of cloneDeepMutable(materials)) {
                changePosition(
                    material,
                    newVehiclePositionIn(vehicle.id),
                    draftState
                );
                draftState.materials[material.id] = material;
            }
            for (const person of cloneDeepMutable(personnel)) {
                changePosition(
                    person,
                    newVehiclePositionIn(vehicle.id),
                    draftState
                );
                draftState.personnel[person.id] = person;
            }

            logVehicleAdded(draftState, vehicle.id);

            return draftState;
        },
        rights: 'trainer',
    };

    export const moveVehicle: ActionReducer<MoveVehicleAction> = {
        action: MoveVehicleAction,
        reducer: (draftState, { vehicleId, targetPosition }) => {
            changePositionWithId(
                vehicleId,
                newMapPositionAt(targetPosition),
                'vehicle',
                draftState
            );
            return draftState;
        },
        rights: 'participant',
    };

    export const renameVehicle: ActionReducer<RenameVehicleAction> = {
        action: RenameVehicleAction,
        reducer: (draftState, { vehicleId, name }) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);
            vehicle.name = name;
            for (const personnelId of Object.keys(vehicle.personnelIds)) {
                draftState.personnel[personnelId]!.vehicleName = name;
            }
            for (const materialId of Object.keys(vehicle.materialIds)) {
                draftState.materials[materialId]!.vehicleName = name;
            }
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeVehicle: ActionReducer<RemoveVehicleAction> = {
        action: RemoveVehicleAction,
        reducer: (draftState, { vehicleId }) => {
            deleteVehicle(draftState, vehicleId);
            return draftState;
        },
        rights: 'trainer',
    };

    export const unloadVehicle: ActionReducer<UnloadVehicleAction> = {
        action: UnloadVehicleAction,
        reducer: (draftState, { vehicleId }) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);

            if (!isOnMap(vehicle) && !isInSimulatedRegion(vehicle)) {
                throw new ReducerError(
                    `Vehicle with id ${vehicleId} is currently not on the map or in a simulated region`
                );
            }

            const materialIds = Object.keys(vehicle.materialIds);
            const personnelIds = Object.keys(vehicle.personnelIds);
            const patientIds = Object.keys(vehicle.patientIds);

            if (isOnMap(vehicle)) {
                const unloadPosition = currentCoordinatesOf(vehicle);
                const vehicleWidthInPosition = imageSizeToPosition(
                    vehicle.image.aspectRatio * vehicle.image.height
                );

                const space =
                    vehicleWidthInPosition /
                    (personnelIds.length +
                        materialIds.length +
                        patientIds.length +
                        1);
                let x = unloadPosition.x - vehicleWidthInPosition / 2;

                // Unload all patients, personnel and material and put them on the vehicle

                for (const patientId of patientIds) {
                    x += space;
                    changePositionWithId(
                        patientId,
                        newMapPositionAt({ x, y: unloadPosition.y }),
                        'patient',
                        draftState
                    );
                    delete vehicle.patientIds[patientId];
                }

                for (const personnelId of personnelIds) {
                    x += space;
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );
                    if (isInVehicle(personnel)) {
                        changePositionWithId(
                            personnelId,
                            newMapPositionAt({ x, y: unloadPosition.y }),
                            'personnel',
                            draftState
                        );
                    }
                }

                for (const materialId of materialIds) {
                    x += space;
                    const material = getElement(
                        draftState,
                        'material',
                        materialId
                    );
                    if (isInVehicle(material)) {
                        changePosition(
                            material,
                            newMapPositionAt({ x, y: unloadPosition.y }),
                            draftState
                        );
                    }
                }
            } else {
                const simulatedRegionId = currentSimulatedRegionIdOf(vehicle);

                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );

                for (const patientId of patientIds) {
                    changePositionWithId(
                        patientId,
                        newSimulatedRegionPositionIn(simulatedRegionId),
                        'patient',
                        draftState
                    );
                    sendSimulationEvent(
                        simulatedRegion,
                        newNewPatientEvent(patientId)
                    );
                    delete vehicle.patientIds[patientId];
                }

                for (const personnelId of personnelIds) {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );

                    if (isInVehicle(personnel)) {
                        changePositionWithId(
                            personnelId,
                            newSimulatedRegionPositionIn(simulatedRegionId),
                            'personnel',
                            draftState
                        );
                        sendSimulationEvent(
                            simulatedRegion,
                            newPersonnelAvailableEvent(personnelId)
                        );
                    }
                }

                for (const materialId of materialIds) {
                    const material = getElement(
                        draftState,
                        'material',
                        materialId
                    );

                    if (isInVehicle(material)) {
                        changePosition(
                            material,
                            newSimulatedRegionPositionIn(simulatedRegionId),
                            draftState
                        );
                        sendSimulationEvent(
                            simulatedRegion,
                            newMaterialAvailableEvent(materialId)
                        );
                    }
                }
            }

            return draftState;
        },
        rights: 'participant',
    };

    export const loadVehicle: ActionReducer<LoadVehicleAction> = {
        action: LoadVehicleAction,
        reducer: (
            draftState,
            { vehicleId, elementToBeLoadedId, elementToBeLoadedType }
        ) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);
            switch (elementToBeLoadedType) {
                case 'material': {
                    const material = getElement(
                        draftState,
                        'material',
                        elementToBeLoadedId
                    );
                    if (!vehicle.materialIds[elementToBeLoadedId]) {
                        throw new ReducerError(
                            `Material with id ${material.id} is not assignable to the vehicle with id ${vehicle.id}`
                        );
                    }
                    changePosition(
                        material,
                        newVehiclePositionIn(vehicleId),
                        draftState
                    );
                    break;
                }
                case 'personnel': {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        elementToBeLoadedId
                    );
                    if (isInTransfer(personnel)) {
                        throw new ReducerError(
                            `Personnel with id ${elementToBeLoadedId} is currently in transfer`
                        );
                    }
                    if (!vehicle.personnelIds[elementToBeLoadedId]) {
                        throw new ReducerError(
                            `Personnel with id ${personnel.id} is not assignable to the vehicle with id ${vehicle.id}`
                        );
                    }
                    changePosition(
                        personnel,
                        newVehiclePositionIn(vehicleId),
                        draftState
                    );
                    break;
                }
                case 'patient': {
                    const patient = getElement(
                        draftState,
                        'patient',
                        elementToBeLoadedId
                    );
                    if (
                        Object.keys(vehicle.patientIds).length >=
                        vehicle.patientCapacity
                    ) {
                        throw new ReducerError(
                            `Vehicle with id ${vehicle.id} is already full`
                        );
                    }
                    vehicle.patientIds[elementToBeLoadedId] = true;
                    changePosition(
                        patient,
                        newVehiclePositionIn(vehicleId),
                        draftState
                    );

                    completelyLoadVehicleHelper(draftState, vehicle);
                }
            }
            return draftState;
        },
        rights: 'participant',
    };

    export const completelyLoadVehicle: ActionReducer<CompletelyLoadVehicleAction> =
        {
            action: CompletelyLoadVehicleAction,
            reducer: (draftState, { vehicleId }) => {
                const vehicle = getElement(draftState, 'vehicle', vehicleId);
                completelyLoadVehicleHelper(draftState, vehicle);

                return draftState;
            },
            rights: 'trainer',
        };

    export const removeVehicleFromSimulatedRegion: ActionReducer<RemoveVehicleFromSimulatedRegionAction> =
        {
            action: RemoveVehicleFromSimulatedRegionAction,
            reducer: (draftState, { vehicleId, simulatedRegionId }) => {
                const vehicle = getElement(draftState, 'vehicle', vehicleId);

                if (!isInSpecificSimulatedRegion(vehicle, simulatedRegionId)) {
                    throw new ReducerError(
                        `Vehicle with id ${vehicleId} has to be in simulated region with id ${simulatedRegionId} to be removed from there.`
                    );
                }

                completelyLoadVehicleHelper(draftState, vehicle);

                const simulatedRegion = currentSimulatedRegionOf(
                    draftState,
                    vehicle
                );
                sendSimulationEvent(
                    simulatedRegion,
                    newVehicleRemovedEvent(vehicleId)
                );

                const coordinates = cloneDeepMutable(
                    currentCoordinatesOf(simulatedRegion)
                );

                // place the vehicle on the right hand side of the simulated region
                coordinates.y -= 0.5 * simulatedRegion.size.height;
                coordinates.x += 5 + Math.max(simulatedRegion.size.width, 0);

                changePositionWithId(
                    vehicleId,
                    newMapPositionAt(coordinates),
                    'vehicle',
                    draftState
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleOccupation: ActionReducer<SetVehicleOccupationAction> =
        {
            action: SetVehicleOccupationAction,
            reducer: (draftState, { vehicleId, occupation }) => {
                const vehicle = getElement(draftState, 'vehicle', vehicleId);
                changeOccupation(draftState, vehicle, occupation);
                return draftState;
            },
            rights: 'trainer',
        };
}
