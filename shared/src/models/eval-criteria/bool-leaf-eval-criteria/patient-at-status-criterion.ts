import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    EvalCriterionId,
} from '../criterion-categories.js';
import { uuid, UUID, uuidSchema } from '../../../utils/uuid.js';
import {
    PatientStatus,
    patientStatusSchema,
} from '../../utils/patient-status.js';

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});
/**
 * This is a bool leaf eval criterion which should evaluate as true, precisely when the target patient's real status is the target status.
 */
export type PatientAtStatusEvalCriterion = z.infer<
    typeof patientAtStatusEvalCriterionSchema
>;
export function newPatientAtStatusEvalCriterion(
    name: string,
    targetPatientId: UUID,
    targetStatus: PatientStatus,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): PatientAtStatusEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
