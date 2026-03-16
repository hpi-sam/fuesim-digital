import { generateDummyPatient } from '../../src/data/index.js';
import { Patient } from '../../src/models/index.js';
import type { PatientStatus, Position } from '../../src/models/utils/index.js';
import {
    currentCoordinatesOf,
    isOnMap,
    SpatialTree,
} from '../../src/models/utils/index.js';
import type { ExerciseState } from '../../src/state.js';
import type { UUID } from '../../src/utils/index.js';
import { cloneDeepMutable } from '../../src/utils/index.js';

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
        patient.treatmentTime = Patient.pretriageTimeThreshold;
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
