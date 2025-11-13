import type { ExerciseState } from '../../../state.js';
import { logVehicle } from '../../../store/action-reducers/utils/log.js';
import type { Mutable } from '../../../utils/index.js';
import { cloneDeepMutable } from '../../../utils/index.js';
import type { Vehicle } from '../../vehicle.js';
import { createOccupationTag } from '../tag-helpers.js';
import type { ExerciseOccupation } from './exercise-occupation.js';

export function isUnoccupied(
    draftState: Mutable<ExerciseState>,
    vehicle: Mutable<Vehicle>
) {
    if (
        vehicle.occupation.type === 'intermediateOccupation' &&
        vehicle.occupation.unoccupiedUntil < draftState.currentTime
    ) {
        changeOccupation(draftState, vehicle, { type: 'noOccupation' });
    }

    return vehicle.occupation.type === 'noOccupation';
}

export function isUnoccupiedOrIntermediarilyOccupied(
    draftState: Mutable<ExerciseState>,
    vehicle: Mutable<Vehicle>
) {
    return (
        isUnoccupied(draftState, vehicle) ||
        vehicle.occupation.type === 'intermediateOccupation'
    );
}

export function changeOccupation(
    draftState: Mutable<ExerciseState>,
    vehicle: Mutable<Vehicle>,
    occupation: ExerciseOccupation
) {
    logVehicle(
        draftState,
        [createOccupationTag(draftState, occupation)],
        `Die Tätigkeit des ${vehicle.name} hat sich geändert.`,
        vehicle.id
    );
    vehicle.occupation = cloneDeepMutable(occupation);
}
