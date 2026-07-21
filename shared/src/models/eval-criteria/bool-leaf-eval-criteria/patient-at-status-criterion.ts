import * as z from 'zod';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newBoolEvalResult } from '../../../utils/eval-result/utils.js';
import type { PatientStatus } from '../../utils/patient-status.js';
import { patientStatusSchema } from '../../utils/patient-status.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';

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
        id: uuid(),
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
    evalCriterion: PatientAtStatusEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
    let isCompleted = false;
    const isYellow = false;
    const targetId = criterion.targetPatientId;
    const patient = context.patients[targetId]!;
    isCompleted = patient.realStatus === criterion.targetStatus;
    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
