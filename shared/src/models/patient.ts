import { isEmpty } from 'lodash-es';
import { z } from 'zod';
import { uuid, type UUID, uuidSchema } from '../utils/uuid.js';
import { uuidSetSchema } from '../utils/uuid-set.js';
import type { PatientHealthState } from './patient-health-state.js';
import { patientHealthStateSchema } from './patient-health-state.js';
import type { PersonalInformation } from './utils/personal-information.js';
import { personalInformationSchema } from './utils/personal-information.js';
import type { PretriageInformation } from './utils/pretriage-information.js';
import { pretriageInformationSchema } from './utils/pretriage-information.js';
import {
    type HealthPoints,
    healthPointsSchema,
} from './utils/health-points.js';
import {
    type BiometricInformation,
    biometricInformationSchema,
} from './utils/biometric-information.js';
import {
    type PatientStatusCode,
    patientStatusCodeSchema,
} from './utils/patient-status-code.js';
import {
    type PatientStatus,
    patientStatusSchema,
} from './utils/patient-status.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';
import { positionSchema, type Position } from './utils/position/position.js';
import {
    isInSimulatedRegion,
    isOnMap,
} from './utils/position/position-helpers.js';

export const patientSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('patient'),
    identifier: z.string(),
    customQRCode: z.string(),
    personalInformation: personalInformationSchema,
    biometricInformation: biometricInformationSchema,
    pretriageInformation: pretriageInformationSchema,
    hasTransportPriority: z.boolean(),
    patientStatusCode: patientStatusCodeSchema,
    pretriageStatus: patientStatusSchema,
    realStatus: patientStatusSchema,
    image: imagePropertiesSchema,
    position: positionSchema,
    /**
     * The time the patient already is in the current state
     */
    stateTime: z.number(),
    healthStates: z.record(uuidSchema, patientHealthStateSchema),
    /**
     * The id of the current health state in {@link healthStates}
     */
    currentHealthStateId: uuidSchema,
    health: healthPointsSchema,
    assignedPersonnelIds: uuidSetSchema,
    assignedMaterialIds: uuidSetSchema,
    /**
     * The speed with which the patients healthStatus changes
     * if it is 0.5 every patient changes half as fast (slow motion)
     */
    timeSpeed: z.number().nonnegative(),
    /**
     * Whether the {@link getVisibleStatus} of this patient has changed
     * since the last time it was updated which personnel and materials treat him/her.
     * Use this to prevent unnecessary recalculations for patients that didn't change -> performance optimization.
     */
    visibleStatusChanged: z.boolean(),
    /**
     * This can be any arbitrary string. It gives trainers the freedom to add additional functionalities that are not natively supported by this application (like an hospital ticket system)
     */
    remarks: z.string().max(65535),
    treatmentTime: z.number().nonnegative(),
    scoutableId: uuidSchema.nullable(),
});
export type Patient = z.infer<typeof patientSchema>;
export const patientPretriageTimeThreshold: number = 60 * 1000; // 1 minute

export function newPatient(
    personalInformation: PersonalInformation,
    biometricInformation: BiometricInformation,
    pretriageInformation: PretriageInformation,
    patientStatusCode: PatientStatusCode,
    pretriageStatus: PatientStatus,
    realStatus: PatientStatus,
    healthStates: { readonly [stateId: UUID]: PatientHealthState },
    currentHealthStateId: UUID,
    image: ImageProperties,
    health: HealthPoints,
    remarks: string,
    position: Position
): Patient {
    return {
        id: uuid(),
        type: 'patient',
        personalInformation,
        biometricInformation,
        pretriageInformation,
        patientStatusCode,
        pretriageStatus,
        realStatus,
        healthStates,
        currentHealthStateId,
        image,
        health,
        remarks,
        position,
        identifier: '',
        customQRCode: '',
        hasTransportPriority: false,
        stateTime: 0,
        assignedMaterialIds: {},
        assignedPersonnelIds: {},
        timeSpeed: 1,
        visibleStatusChanged: false,
        treatmentTime: 0,
        scoutableId: null,
    };
}
export function getPatientVisibleStatus(
    patient: Patient,
    pretriageEnabled: boolean,
    bluePatientsEnabled: boolean
) {
    const status =
        !pretriageEnabled || isPretriageStatusLocked(patient)
            ? patient.realStatus
            : patient.pretriageStatus;
    return status === 'blue' && !bluePatientsEnabled ? 'red' : status;
}

export function isPretriageStatusLocked(patient: Patient): boolean {
    return patient.treatmentTime >= patientPretriageTimeThreshold;
}

export function isTreatedByPersonnel(patient: Patient) {
    return !isEmpty(patient.assignedPersonnelIds);
}

export function canBeTreated(patient: Patient) {
    return isOnMap(patient) || isInSimulatedRegion(patient);
}
