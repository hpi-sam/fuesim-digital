import type { WritableDraft } from 'immer';
import {
    changePosition,
    changePositionWithId,
} from '../../../models/utils/position/position-helpers-mutable.js';
import { sendSimulationEvent } from '../../../simulation/events/utils.js';
import type { ExerciseState } from '../../../state.js';
import { newMaterialRemovedEvent } from '../../../simulation/events/material-removed.js';
import { newPersonnelRemovedEvent } from '../../../simulation/events/personnel-removed.js';
import {
    currentSimulatedRegionIdOf,
    isInSimulatedRegion,
    isInSpecificVehicle,
    isInTransfer,
} from '../../../models/utils/position/position-helpers.js';
import type { Vehicle } from '../../../models/vehicle.js';
import { newVehiclePositionIn } from '../../../models/utils/position/vehicle-position.js';
import { getElement } from './get-element.js';

/**
 * Checks whether all materials and personnel belonging to a vehicle are in it.
 *
 * @param draftState The state to operate in
 * @param vehicle The vehicle to check
 * @returns `true` if everything is in the vehicle, `false` otherwise
 */
export function isCompletelyLoaded(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>
) {
    const materialsLoaded = Object.keys(vehicle.materialIds).map((materialId) =>
        isInSpecificVehicle(
            getElement(draftState, 'material', materialId),
            vehicle.id
        )
    );

    const personnelLoaded = Object.keys(vehicle.personnelIds).map(
        (personnelId) =>
            isInSpecificVehicle(
                getElement(draftState, 'personnel', personnelId),
                vehicle.id
            )
    );

    return (
        materialsLoaded.every((loaded) => loaded) &&
        personnelLoaded.every((loaded) => loaded)
    );
}

/**
 * Loads all materials and personnel belonging to a vehicle into it.
 * Personnel that is currently in transfer won't be loaded.
 *
 * @param draftState The state to operate in
 * @param vehicle The vehicle to load
 */
export function completelyLoadVehicle(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>
) {
    const inSimulation = isInSimulatedRegion(vehicle);
    const simulatedRegionId = inSimulation
        ? currentSimulatedRegionIdOf(vehicle)
        : undefined;
    const simulatedRegion = inSimulation
        ? getElement(draftState, 'simulatedRegion', simulatedRegionId!)
        : undefined;

    const vehiclePosition = newVehiclePositionIn(vehicle.id);

    Object.keys(vehicle.materialIds).forEach((materialId) => {
        changePositionWithId(
            materialId,
            vehiclePosition,
            'material',
            draftState
        );

        if (inSimulation) {
            sendSimulationEvent(
                simulatedRegion!,
                newMaterialRemovedEvent(materialId)
            );
        }
    });

    Object.keys(vehicle.personnelIds).forEach((personnelId) => {
        const personnel = getElement(draftState, 'personnel', personnelId);

        if (!isInTransfer(personnel)) {
            changePosition(personnel, vehiclePosition, draftState);

            if (inSimulation) {
                sendSimulationEvent(
                    simulatedRegion!,
                    newPersonnelRemovedEvent(personnelId)
                );
            }
        }
    });
}
