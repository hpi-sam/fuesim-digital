import z from 'zod';
import {
    EvalCriterion,
    EvalResult,
    EvalResultContext,
    newNumberEvalResult,
    NumberEvalCriterion,
    numberEvalCriterionBaseSchema,
    UUID,
    NumberEvalResult,
    PatientStatus,
    patientStatusSchema,
    uuid,
} from 'fuesim-digital-shared';

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
        id: uuid() as UUID,
        name,
        type: 'evalCriterion',
        criterionType: 'countPatientsAtStatusEvalCriterion',
        targetStatus,
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfCountPatientsAtStatusCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    const criterion = evalCriterion as CountPatientsAtStatusEvalCriterion;
    let num = null;

    if (!num) {
        console.log(
            `[logic Error]: trying to return result of numberCriterion${
                criterion.id
            } without calculating the number value. The critrerionType is : ${criterion.criterionType}`
        );
        num = -1;
    }
    /* TODO @JohannesPotzi @Jogius : implementation*/
    console.log(
        'TODO: Implementation of CountPatientsAtStatusCriterion evaluation.'
    );
    num = -1;
    return newNumberEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
