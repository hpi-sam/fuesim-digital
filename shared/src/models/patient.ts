import { isEmpty } from 'lodash-es';
import { z } from 'zod';
import type { UUID } from '../utils/index.js';
import { uuid, uuidSetSchema } from '../utils/index.js';
import type { PatientHealthState } from './patient-health-state.js';
import { patientHealthStateSchema } from './patient-health-state.js';
import type {
    BiometricInformation,
    PatientStatusCode,
    PatientStatus,
    ImageProperties,
    HealthPoints,
    Position,
} from './utils/index.js';
import {
    biometricInformationSchema,
    patientStatusCodeSchema,
    isInSimulatedRegion,
    isOnMap,
    imagePropertiesSchema,
    patientStatusSchema,
    positionSchema,
    healthPointsSchema,
} from './utils/index.js';
import type { PersonalInformation } from './utils/personal-information.js';
import { personalInformationSchema } from './utils/personal-information.js';
import type { PretriageInformation } from './utils/pretriage-information.js';
import { pretriageInformationSchema } from './utils/pretriage-information.js';
export const patientSchema = z.strictObject({
    id: z.uuidv4(),
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
    healthStates: z.record(z.uuidv4(), patientHealthStateSchema),
    /**
     * The id of the current health state in {@link healthStates}
     */
    currentHealthStateId: z.uuidv4(),
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
