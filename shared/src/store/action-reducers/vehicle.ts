import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { newNoPosition } from '../../models/utils/position/no-position.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
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
import { vehicleParametersSchema } from '../../models/utils/vehicle-parameters.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { exerciseOccupationSchema } from '../../models/utils/occupations/exercise-occupation.js';
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
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { vehicleSchema } from '../../models/vehicle.js';
import type { Vehicle } from '../../models/vehicle.js';
import type { ExerciseConfiguration } from '../../models/exercise-configuration.js';
import { getElement } from './utils/get-element.js';
import { deletePatient } from './patient.js';
import { completelyLoadVehicle as completelyLoadVehicleHelper } from './utils/completely-load-vehicle.js';
import { removeElementPosition } from './utils/spatial-elements.js';
import { logVehicleAdded, logVehicleRemoved } from './utils/log.js';
import { checkRestrictedVehicleMovementOrThrow } from './utils/restricted-vehicle-movement.js';
import { fillPositionAt } from './utils/operational-assignment-positions.js';

/**
 * Gets the remaining load time for a vehicle
 * @param vehicle The vehicle to get the remaining load time for
 * @param time The time to check the loading state at. Should typically be the current time
 * @param config The current {@link ExerciseConfiguration}, to check whether load times are enabled
 * @returns The remaining load time of the vehicle in seconds
 */
export function getRemainingVehicleLoadSeconds(
    vehicle: Vehicle,
    time: number,
    config: ExerciseConfiguration
) {
    if (!config.vehicleLoadTimesEnabled) return 0;

    const patientLoadTime = vehicle.patientLoadMinutes * 60 * 1000;
    return Object.values(vehicle.patientLoadTimes)
        .map((loadTime) =>
            Math.ceil((patientLoadTime - (time - loadTime)) / 1000)
        )
        .filter((remainingSeconds) => remainingSeconds > 0)
        .reduce((a, b) => Math.max(a, b), 0);
}

/**
 * Checks whether a vehicle is being loaded at the given time
 * @param vehicle The vehicle to check whether it is being loaded
 * @param time The time to check the loading state at. Should typically be the current time
 * @param config The current {@link ExerciseConfiguration}, to check whether load times are enabled
 * @returns `true`, is the vehicle is currently being loaded, `false` otherwise
 */
export function isVehicleLoading(
    vehicle: Vehicle,
    time: number,
    config: ExerciseConfiguration
) {
    return getRemainingVehicleLoadSeconds(vehicle, time, config) > 0;
}

/**
 * Increments {@link draftState.vehicleCounter} and replaces the first `#` in the vehicle name by the current counter for the vehicle template
 * @param draftState The state to operate on
 * @param vehicle The vehicle to apply the number on
 * @returns The mutated vehicle
 */
function applyVehicleNumber(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>
) {
    if (!Object.hasOwn(draftState.vehicleCounters, vehicle.templateId))
        draftState.vehicleCounters[vehicle.templateId] = 0;

    const vehicleNumber = ++draftState.vehicleCounters[vehicle.templateId]!;

    vehicle.name = vehicle.name.replace('#', String(vehicleNumber));

    return vehicle;
}

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

const addVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Add vehicle'),
    vehicleParameters: vehicleParametersSchema,
});
export type AddVehicleAction = Immutable<
    z.infer<typeof addVehicleActionSchema>
>;

const renameVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Rename vehicle'),
    vehicleId: vehicleSchema.shape.id,
    name: vehicleSchema.shape.name,
});
export type RenameVehicleAction = Immutable<
    z.infer<typeof renameVehicleActionSchema>
>;

const moveVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Move vehicle'),
    vehicleId: vehicleSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveVehicleAction = Immutable<
    z.infer<typeof moveVehicleActionSchema>
>;

const removeVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Remove vehicle'),
    vehicleId: vehicleSchema.shape.id,
});
export type RemoveVehicleAction = Immutable<
    z.infer<typeof removeVehicleActionSchema>
>;

const unloadVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Unload vehicle'),
    vehicleId: vehicleSchema.shape.id,
});
export type UnloadVehicleAction = Immutable<
    z.infer<typeof unloadVehicleActionSchema>
>;

const loadVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Load vehicle'),
    vehicleId: vehicleSchema.shape.id,
    elementToBeLoadedType: z.enum(['material', 'patient', 'personnel']),
    elementToBeLoadedId: uuidSchema,
});
export type LoadVehicleAction = Immutable<
    z.infer<typeof loadVehicleActionSchema>
>;

const completelyLoadVehicleActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Completely load vehicle'),
    vehicleId: vehicleSchema.shape.id,
});
export type CompletelyLoadVehicleAction = Immutable<
    z.infer<typeof completelyLoadVehicleActionSchema>
>;

const removeVehicleFromSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Remove from simulated region'),
    vehicleId: vehicleSchema.shape.id,
    simulatedRegionId: uuidSchema,
});
export type RemoveVehicleFromSimulatedRegionAction = Immutable<
    z.infer<typeof removeVehicleFromSimulatedRegionActionSchema>
>;

const setVehicleOccupationActionSchema = z.strictObject({
    type: z.literal('[Vehicle] Set occupation'),
    vehicleId: vehicleSchema.shape.id,
    occupation: exerciseOccupationSchema,
});
export type SetVehicleOccupationAction = Immutable<
    z.infer<typeof setVehicleOccupationActionSchema>
>;

export namespace VehicleActionReducers {
    export const addVehicle: ActionReducer<AddVehicleAction> = {
        type: addVehicleActionSchema.shape.type.value,
        actionSchema: addVehicleActionSchema,
        reducer: (draftState, { vehicleParameters }) => {
            const { vehicle, materials, personnel } = vehicleParameters;
            if (
                materials.some(
                    (material) =>
                        material.vehicleId !== vehicle.id ||
                        vehicle.materialIds[material.id] === undefined
                ) ||
                Object.keys(vehicle.materialIds).length !== materials.length
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
                Object.keys(vehicle.personnelIds).length !== personnel.length
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

            draftState.vehicles[vehicle.id] = applyVehicleNumber(
                draftState,
                cloneDeepMutable(vehicle)
            );
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
        type: moveVehicleActionSchema.shape.type.value,
        actionSchema: moveVehicleActionSchema,
        reducer: (draftState, { vehicleId, targetPosition }) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);
            if (
                isVehicleLoading(
                    vehicle,
                    draftState.currentTime,
                    draftState.configuration
                )
            )
                throw new ExpectedReducerError(
                    'Das Fahrzeug wird gerade beladen und kann daher nicht bewegt werden'
                );

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
        type: renameVehicleActionSchema.shape.type.value,
        actionSchema: renameVehicleActionSchema,
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
        type: removeVehicleActionSchema.shape.type.value,
        actionSchema: removeVehicleActionSchema,
        reducer: (draftState, { vehicleId }) => {
            deleteVehicle(draftState, vehicleId);
            return draftState;
        },
        rights: 'trainer',
    };

    export const unloadVehicle: ActionReducer<UnloadVehicleAction> = {
        type: unloadVehicleActionSchema.shape.type.value,
        actionSchema: unloadVehicleActionSchema,
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
                    delete vehicle.patientLoadTimes[patientId];
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
        type: loadVehicleActionSchema.shape.type.value,
        actionSchema: loadVehicleActionSchema,
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
                    if (
                        isVehicleLoading(
                            vehicle,
                            draftState.currentTime,
                            draftState.configuration
                        )
                    )
                        throw new ExpectedReducerError(
                            'Es kann nur ein Patient gleichzeitig eingeladen werden'
                        );

                    vehicle.patientIds[elementToBeLoadedId] = true;
                    vehicle.patientLoadTimes[elementToBeLoadedId] =
                        draftState.currentTime;
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
            type: completelyLoadVehicleActionSchema.shape.type.value,
            actionSchema: completelyLoadVehicleActionSchema,
            reducer: (draftState, { vehicleId }) => {
                const vehicle = getElement(draftState, 'vehicle', vehicleId);
                completelyLoadVehicleHelper(draftState, vehicle);

                return draftState;
            },
            rights: (state, client, action) =>
                state.configuration.participantLoadAllEnabled
                    ? 'participant'
                    : 'trainer',
        };

    export const removeVehicleFromSimulatedRegion: ActionReducer<RemoveVehicleFromSimulatedRegionAction> =
        {
            type: removeVehicleFromSimulatedRegionActionSchema.shape.type.value,
            actionSchema: removeVehicleFromSimulatedRegionActionSchema,
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
            type: setVehicleOccupationActionSchema.shape.type.value,
            actionSchema: setVehicleOccupationActionSchema,
            reducer: (draftState, { vehicleId, occupation }) => {
                const vehicle = getElement(draftState, 'vehicle', vehicleId);
                changeOccupation(draftState, vehicle, occupation);
                return draftState;
            },
            rights: 'trainer',
        };
}
