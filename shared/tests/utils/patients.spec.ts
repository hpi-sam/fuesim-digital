import type { WritableDraft } from 'immer';
import {
    generateDummyPatient,
    currentCoordinatesOf,
    isOnMap,
    SpatialTree,
    cloneDeepMutable,
    patientPretriageTimeThreshold,
} from '../../src/index.js';
import type {
    PatientStatus,
    Position,
    UUID,
    Patient,
} from '../../src/index.js';
import type { ExerciseState } from '../../src/state.js';

export function addPatient(
    state: WritableDraft<ExerciseState>,
    pretriageStatus: PatientStatus,
    realStatus: PatientStatus,
    position?: Position,
    uuid?: UUID
): WritableDraft<Patient> {
    const patient = cloneDeepMutable(generateDummyPatient());
    patient.pretriageStatus = pretriageStatus;
    if (pretriageStatus !== 'white') {
        patient.treatmentTime = patientPretriageTimeThreshold;
    }
    patient.realStatus = realStatus;
    if (position) {
        patient.position = cloneDeepMutable(position);

        if (isOnMap(patient)) {
            SpatialTree.addElement(
                state.spatialTrees.patients,
                patient.id,
                currentCoordinatesOf(patient)
            );
        }
    }
    if (uuid) {
        patient.id = uuid;
    }
    state.patients[patient.id] = patient;
    return patient;
}
