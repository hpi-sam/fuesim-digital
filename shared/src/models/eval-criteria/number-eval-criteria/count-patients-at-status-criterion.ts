import z from 'zod';
import {
    numberEvalCriterionBaseSchema,
    NumberEvalCriterionId,
} from '../criterion-categories.js';
import {
    PatientStatus,
    patientStatusSchema,
} from '../../utils/patient-status.js';
import { uuid } from '../../../utils/uuid.js';

export const countPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    targetStatus: patientStatusSchema,
    criterionType: z.literal('countPatientsAtStatusEvalCriterion'),
});
/** This is a number eval criterion with a target PatientStatus;
 * The respective EvalResult holds the count of patients with the specified status as real status.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
export type CountPatientsAtStatusEvalCriterion = z.infer<
    typeof countPatientsAtStatusEvalCriterionSchema
>;
export function newCountPatientsAtStatusEvalCriterion(
    name: string,
    targetStatus: PatientStatus,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CountPatientsAtStatusEvalCriterion {
    return {
        id: uuid() as NumberEvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'countPatientsAtStatusEvalCriterion',
        targetStatus,
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
    };
}
