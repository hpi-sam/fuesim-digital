import type {
    ExerciseState,
    HealthPoints,
    PatientUpdate,
    Patient,
} from 'fuesim-digital-shared';
import {
    canBeTreated,
    getElement,
    healthPointsDefaults,
    isTreatedByPersonnel,
} from 'fuesim-digital-shared';

/**
 * The count of assigned personnel and material that cater for a {@link Patient}.
 */
type Catering = { [key in string]: number } & { material: number };

/**
 * Apply the patient tick to the {@link state}
 * @param state The {@link ExerciseState} the patient tick should be applied on later
 * @param patientTickInterval The interval in ms between calls to this function
 * @returns An array of {@link PatientUpdate}s to apply to the {@link state} in a reducer
 */
export function patientTick(
    state: ExerciseState,
    patientTickInterval: number
): PatientUpdate[] {
    return Object.values(state.patients)
        .filter(canBeTreated)
        .map((patient) => {
            // update the time a patient is being treated, to check for pretriage later
            const treatmentTime = isTreatedByPersonnel(patient)
                ? patient.treatmentTime + patientTickInterval
                : patient.treatmentTime;
            const nextHealthPoints = getNextPatientHealthPoints(
                patient,
                getDedicatedResources(state, patient),
                patientTickInterval
            );
            const nextStateId = getNextStateId(patient);
            const nextStateTime =
                nextStateId === patient.currentHealthStateId
                    ? patient.stateTime +
                      patientTickInterval * patient.timeSpeed
                    : 0;
            return {
                id: patient.id,
                nextHealthPoints,
                nextStateId,
                nextStateTime,
                treatmentTime,
            };
        });
}

/**
 * Find catering personnel/material for a {@link patient}
 * @param state The {@link ExerciseState} to use
 * @param patient The {@link Patient} to find associated material and personnel for
 * @returns An object containing the count of assigned personnel and material that cater for the {@link patient}.
 */
function getDedicatedResources(
    state: ExerciseState,
    patient: Patient
): Catering {
    const cateringTypes: Catering = {
        notarzt: 0,
        notSan: 0,
        rettSan: 0,
        san: 0,
        gf: 0,
        material: Object.keys(patient.assignedMaterialIds).length,
    };

    // Get the number of every personnel
    Object.keys(patient.assignedPersonnelIds).forEach((personnelId) => {
        const personnelType = getElement(
            state,
            'personnel',
            personnelId
        ).personnelType;
        if (!cateringTypes[personnelType]) return;
        cateringTypes[personnelType]++;
    });

    return cateringTypes;
}

/**
 * Calculate the next {@link HealthPoints} for the {@link patient}.
 * @param patient The {@link Patient} to calculate the {@link HealthPoints} for.
 * @param treatedBy The count of personnel/material catering for the {@link patient}.
 * @param patientTickInterval The time in ms between calls to this function.
 * @returns The next {@link HealthPoints} for the {@link patient}
 */
// This is a heuristic and doesn't have to be 100% correct - the players don't see the healthPoints but only the color
// This function could be as complex as we want it to be (Math.sin to get something periodic, higher polynoms...)
function getNextPatientHealthPoints(
    patient: Patient,
    treatedBy: Catering,
    patientTickInterval: number
): HealthPoints {
    let material = treatedBy.material;
    const notarzt = treatedBy['notarzt'] ?? 0;
    const notSan = treatedBy['notSan'] ?? 0;
    const rettSan = treatedBy['rettSan'] ?? 0;
    // TODO: Sans should be able to treat patients too.
    const functionParameters =
        patient.healthStates[patient.currentHealthStateId]!.functionParameters;
    // To do anything the personnel needs material
    // TODO: But a personnel should probably be able to treat a patient a bit without material - e.g. free airways, just press something on a strongly bleeding wound, etc.
    // -> find a better heuristic
    let equippedNotarzt = Math.min(notarzt, material);
    material = Math.max(material - equippedNotarzt, 0);
    let equippedNotSan = Math.min(notSan, material);
    material = Math.max(material - equippedNotSan, 0);
    let equippedRettSan = Math.min(rettSan, material);
    // much more notarzt != much better patient
    equippedNotarzt = Math.log2(equippedNotarzt + 1);
    equippedNotSan = Math.log2(equippedNotSan + 1);
    equippedRettSan = Math.log2(equippedRettSan + 1);
    // TODO: some more heuristic precalculations ...
    // e.g. each second we lose 100 health points
    const changedHealthPerSecond =
        functionParameters.constantChange +
        // e.g. if we have a notarzt we gain 500 additional health points per second
        functionParameters.notarztModifier * equippedNotarzt +
        functionParameters.notSanModifier * equippedNotSan +
        functionParameters.rettSanModifier * equippedRettSan;

    return Math.max(
        healthPointsDefaults.min,
        Math.min(
            healthPointsDefaults.max,
            // our current health points
            patient.health +
                (changedHealthPerSecond / 1000) *
                    patientTickInterval *
                    patient.timeSpeed
        )
    );
}

/**
 * Find the next {@link PatientHealthState} id for the {@link patient} by using the {@link ConditionParameters}.
 * @param patient The {@link Patient} to get the next {@link PatientHealthState} id for.
 * @returns The next {@link PatientHealthState} id.
 */
function getNextStateId(patient: Patient) {
    const currentState = patient.healthStates[patient.currentHealthStateId]!;
    for (const nextConditions of currentState.nextStateConditions) {
        if (
            (nextConditions.earliestTime === undefined ||
                patient.stateTime > nextConditions.earliestTime) &&
            (nextConditions.latestTime === undefined ||
                patient.stateTime < nextConditions.latestTime) &&
            (nextConditions.minimumHealth === undefined ||
                patient.health >= nextConditions.minimumHealth) &&
            (nextConditions.maximumHealth === undefined ||
                patient.health <= nextConditions.maximumHealth) &&
            (nextConditions.isBeingTreated === undefined ||
                isTreatedByPersonnel(patient) === nextConditions.isBeingTreated)
        ) {
            return nextConditions.matchingHealthStateId;
        }
    }
    return patient.currentHealthStateId;
}
