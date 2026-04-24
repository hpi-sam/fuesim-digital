import type { WritableDraft } from 'immer';
import { z } from 'zod';
import { uuidSchema } from '../utils/uuid.js';

import { personalInformationSchema } from './utils/personal-information.js';
import { patientHealthStateSchema } from './patient-health-state.js';
import { biometricInformationSchema } from './utils/biometric-information.js';
import { patientStatusSchema } from './utils/patient-status.js';
import { imagePropertiesSchema } from './utils/image-properties.js';
import { healthPointsSchema } from './utils/health-points.js';
import type { Patient } from './patient.js';

export const hospitalPatientSchema = z.strictObject({
    /**
     * Id of the patient that was transported to a hospital, the original patient gets deleted
     */
    patientId: uuidSchema,
    type: z.literal('hospitalPatient'),
    identifier: z.string(),
    customQRCode: z.string(),
    /**
     * the vehicle that a patient was transported with
     */
    vehicleType: z.string(),
    /**
     * The time the patient started to be sent to a hospital
     */
    startTime: z.number(),
    /**
     * The time the patient would arrive at a hospital
     */
    arrivalTime: z.number(),
    personalInformation: personalInformationSchema,
    biometricInformation: biometricInformationSchema,
    pretriageStatus: patientStatusSchema,
    realStatus: patientStatusSchema,
    hasTransportPriority: z.boolean(),
    image: imagePropertiesSchema,
    healthStates: z.record(uuidSchema, patientHealthStateSchema),
    /**
     * The id of the current health state in {@link healthStates}
     */
    currentHealthStateId: uuidSchema,
    health: healthPointsSchema,
    treatmentTime: z.number().nonnegative(),
});
export type HospitalPatient = z.infer<typeof hospitalPatientSchema>;

/**
 * used to create a Mutable\<HospitalPatient\> inside action-reducers/hospital.ts
 * @param patient that should be copied
 * @param startTime time the transport starts
 * @param arrivalTime time the patient would arrive at a hospital
 * @returns a Mutable\<HospitalPatient\>
 */
export function newHospitalPatientFromPatient(
    patient: WritableDraft<Patient>,
    vehicleType: string,
    startTime: number,
    arrivalTime: number
): HospitalPatient {
    return {
        patientId: patient.id,
        type: 'hospitalPatient',
        identifier: patient.identifier,
        customQRCode: patient.customQRCode,
        vehicleType,
        startTime,
        arrivalTime,
        personalInformation: patient.personalInformation,
        biometricInformation: patient.biometricInformation,
        pretriageStatus: patient.pretriageStatus,
        realStatus: patient.realStatus,
        hasTransportPriority: patient.hasTransportPriority,
        healthStates: patient.healthStates,
        currentHealthStateId: patient.currentHealthStateId,
        image: patient.image,
        health: patient.health,
        treatmentTime: patient.treatmentTime,
    };
}
