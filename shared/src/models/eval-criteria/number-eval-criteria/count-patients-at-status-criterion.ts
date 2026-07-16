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
