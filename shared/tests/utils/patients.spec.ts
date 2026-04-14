import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../src/state.js';
import type { PatientStatus } from '../../src/models/utils/patient-status.js';
import type { Position } from '../../src/models/utils/position/position.js';
import type { UUID } from '../../src/utils/uuid.js';
import type { Patient } from '../../src/models/patient.js';
import { patientPretriageTimeThreshold } from '../../src/models/patient.js';
import { cloneDeepMutable } from '../../src/utils/clone-deep.js';
import { generateDummyPatient } from '../../src/data/dummy-objects/patient.js';
import {
    currentCoordinatesOf,
    isOnMap,
} from '../../src/models/utils/position/position-helpers.js';
import { SpatialTree } from '../../src/models/utils/spatial-tree.js';

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
