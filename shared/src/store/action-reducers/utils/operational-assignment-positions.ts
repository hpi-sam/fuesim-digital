import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../../index.js';

/**
 * Update position of all vehicles in and behind `position` to make space.
 * Note: This function should be called *before* assigning a new vehicle to this position, otherwise, it too will be moved.
 * @param draftState
 * @param sectionId
 * @param position
 */
export function freePositionAt(
    draftState: WritableDraft<ExerciseState>,
    sectionId: string,
    position: number
) {
    //
    Object.values(draftState.vehicles).forEach((v) => {
        if (
            v.operationalAssignment?.type === 'operationalSection' &&
            v.operationalAssignment.role === 'operationalSectionMember' &&
            v.operationalAssignment.sectionId === sectionId &&
            v.operationalAssignment.position >= position
        ) {
            v.operationalAssignment.position += 1;
        }
    });
}

/**
 * Update position of all vehicles behind `position` to fill gap.
 * @param draftState
 * @param sectionId
 * @param position
 */
export function fillPositionAt(
    draftState: WritableDraft<ExerciseState>,
    sectionId: string,
    position: number
) {
    Object.values(draftState.vehicles).forEach((v) => {
        if (
            v.operationalAssignment?.type === 'operationalSection' &&
            v.operationalAssignment.role === 'operationalSectionMember' &&
            v.operationalAssignment.sectionId === sectionId &&
            v.operationalAssignment.position > position
        ) {
            v.operationalAssignment.position -= 1;
        }
    });
}
