// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NoPosition } from '../../../models/utils/position/no-position.js';
import type { Vehicle } from '../../../models/vehicle.js';
import type { ExerciseState } from '../../../state.js';
import {
    coordinatesOfPosition,
    isPositionInSimulatedRegion,
    isPositionInTransfer,
    isPositionOnMap,
} from '../../../models/utils/position/position-helpers.js';
import {
    countRestrictedVehiclesInRestrictedZone,
    getVehicleTemplateRestriction,
    isInRestrictedZone,
} from '../../../models/restricted-zone.js';
import { ExpectedReducerError } from '../../reducer-error.js';
import type { Position } from '../../../models/utils/position/position.js';

/**
 * Checks whether moving the vehicle from the old to the new position is allowed under the constraints of all restricted zones.
 * You can call this function both before or after the move, since both the old and the new position are passed explicitly.
 * @param state The exercise state to check the movement in. Used to access the restricted zones.
 * @param vehicle The vehicle to check the movement for
 * @param oldPosition The old position of the vehicle. Use {@link NoPosition} for newly added vehicles.
 * @param newPosition The new (i.e. target) position of the vehicle.
 * @returns `true` if the movement is allowed under all restrictions from restricted zones, `false` otherwise.
 */
export function checkRestrictedVehicleMovement(
    state: ExerciseState,
    vehicle: Vehicle,
    oldPosition: Position,
    newPosition: Position
) {
    // Early return: We don't have to check anything if the vehicle is not being moved to some position on the map
    if (!isPositionOnMap(newPosition)) return true;

    // Early return: We don't consider restrictions for automatic movements
    // (vehicles arriving from transfer or being moved from a simulated region to the map).
    // Handling those cases properly would be overly complex. Instead, participants should care for this by themselves
    // (e.g., asking the target whether they can handle another vehicle) and the trainers can point out if someone forgot to ask,
    // so we actually have something the participants can learn from.
    if (
        isPositionInTransfer(oldPosition) ||
        isPositionInSimulatedRegion(oldPosition)
    )
        return true;

    const restrictedZonesAtTarget = Object.values(state.restrictedZones).filter(
        (rz) => isInRestrictedZone(rz, coordinatesOfPosition(newPosition))
    );

    for (const restrictedZone of restrictedZonesAtTarget) {
        // If the vehicle already is in this restricted zone, every movement within it is allowed.
        // Otherwise, no vehicle could be moved if a zone is above limit (e.g. by reducing the limit during the exercise
        // or if the limits are overridden (vehicles from transfer/simulated regions, see above)).
        if (
            isPositionOnMap(oldPosition) &&
            isInRestrictedZone(
                restrictedZone,
                coordinatesOfPosition(oldPosition)
            )
        )
            continue;

        const vehicleRestriction = getVehicleTemplateRestriction(
            restrictedZone,
            vehicle.templateId
        );
        if (vehicleRestriction === 'ignore') continue;
        else if (vehicleRestriction === 'prohibit') return false;

        const vehiclesInZone = countRestrictedVehiclesInRestrictedZone(
            state,
            restrictedZone,
            vehicle.id // Ignore the vehicle we're currently checking (in case this function has been called *after* the move)
        );
        if (vehiclesInZone >= restrictedZone.capacity) return false;
    }

    return true;
}

/**
 * A wrapper around {@link checkRestrictedVehicleMovement} that throws a {@link ReducerError} if the movement is not allowed.
 */
export function checkRestrictedVehicleMovementOrThrow(
    state: ExerciseState,
    vehicle: Vehicle,
    oldPosition: Position,
    newPosition: Position
) {
    if (
        !checkRestrictedVehicleMovement(
            state,
            vehicle,
            oldPosition,
            newPosition
        )
    )
        throw new ExpectedReducerError(
            'Eine eingeschränkte Zone verbietet es, das Fahrzeug an diese Stelle zu bewegen.'
        );
}
