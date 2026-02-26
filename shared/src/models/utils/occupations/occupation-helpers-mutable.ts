import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../../state.js';
import { logVehicle } from '../../../store/action-reducers/utils/log.js';
import { cloneDeepMutable } from '../../../utils/index.js';
import type { Vehicle } from '../../vehicle.js';
import { createOccupationTag } from '../tag-helpers.js';
import type { ExerciseOccupation } from './exercise-occupation.js';
import { newNoOccupation } from './no-occupation.js';

export function isUnoccupied(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>
) {
    if (
        vehicle.occupation.type === 'intermediateOccupation' &&
        vehicle.occupation.unoccupiedUntil < draftState.currentTime
    ) {
        changeOccupation(draftState, vehicle, newNoOccupation());
    }

    return vehicle.occupation.type === 'noOccupation';
}

export function isUnoccupiedOrIntermediarilyOccupied(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>
) {
    return (
        isUnoccupied(draftState, vehicle) ||
        vehicle.occupation.type === 'intermediateOccupation'
    );
}

export function changeOccupation(
    draftState: WritableDraft<ExerciseState>,
    vehicle: WritableDraft<Vehicle>,
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
