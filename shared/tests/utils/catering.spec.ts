import { produce } from 'immer';
import type { ExerciseState } from '../../src/state.js';
import { getElement } from '../../src/index.js';
import type { UUID } from '../../src/index.js';

export interface Catering {
    /**
     * The id of the material or personnel catering
     */
    catererId: UUID;
    catererType: 'material' | 'personnel';
    /**
     * All patients treated by {@link catererId}
     */
    patientIds: UUID[];
}

/**
 * Asserts that adding the specified {@link caterings} to the {@link beforeState} results in the caterings specified in {@link newState}.
 * If the {@link beforeState} has already caterings in it, these will not be removed.
 */
export function assertCatering(
    beforeState: ExerciseState,
    newState: ExerciseState,
    caterings: Catering[]
) {
    // Add all caterings to the before state and look whether the result is the newState
    const shouldState = produce(beforeState, (draftState) => {
        for (const catering of caterings) {
            // Update all the patients
            const patients = catering.patientIds.map((patientId) =>
                getElement(draftState, 'patient', patientId)
            );
            for (const patient of patients) {
                patient[
                    catering.catererType === 'material'
                        ? 'assignedMaterialIds'
                        : 'assignedPersonnelIds'
                ][catering.catererId] = true;
            }
            // Update the catering element
            const cateringElement = getElement(
                draftState,
                catering.catererType,
                catering.catererId
            );
            for (const patientId of catering.patientIds) {
                cateringElement.assignedPatientIds[patientId] = true;
            }
        }
        return draftState;
    });
    expect(newState.materials).toStrictEqual(shouldState.materials);
    expect(newState.patients).toStrictEqual(shouldState.patients);
    expect(newState.personnel).toStrictEqual(shouldState.personnel);
}
