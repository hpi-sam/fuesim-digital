import z from 'zod';
import {} from '../criterion-categories.js';
import {} from '../../../utils/uuid.js';
import {} from '../../utils/patient-status.js';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    EvalCriterion,
    uuid,
    UUID,
    uuidSchema,
    PatientStatus,
    patientStatusSchema,
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    newBoolEvalResult,
} from 'fuesim-digital-shared';

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
        id: uuid() as UUID,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfPatientAtStatusCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion as PatientAtStatusEvalCriterion;
    let isCompleted = false;
    let isYellow = false;
    const targetId = criterion.targetPatientId;
    const patient = context.patients[targetId]!;
    isCompleted = patient.realStatus === criterion.targetStatus;
    return newBoolEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as BoolEvalCriterion,
        isCompleted,
        isYellow
    );
}
