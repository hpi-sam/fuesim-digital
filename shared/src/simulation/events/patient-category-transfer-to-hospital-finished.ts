import { z } from 'zod';
import {
    type PatientStatus,
    patientStatusSchema,
} from '../../models/utils/patient-status.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientCategoryTransferToHospitalFinishedEventSchema =
    simulationEventSchema.extend({
        type: z.literal('patientCategoryTransferToHospitalFinishedEvent'),
        patientCategory: patientStatusSchema,
        /**
         * This is true, if this refers to its own one single region.
         * This is false, if it refers to all regions managed by one behavior.
         */
        isRelatedOnlyToOwnRegion: z.boolean(),
    });
export type PatientCategoryTransferToHospitalFinishedEvent = z.infer<
    typeof patientCategoryTransferToHospitalFinishedEventSchema
>;

export function newPatientCategoryTransferToHospitalFinishedEvent(
    patientCategory: PatientStatus,
    isRelatedOnlyToOwnRegion: boolean
): PatientCategoryTransferToHospitalFinishedEvent {
    return {
        type: 'patientCategoryTransferToHospitalFinishedEvent',
        patientCategory,
        isRelatedOnlyToOwnRegion,
    };
}
