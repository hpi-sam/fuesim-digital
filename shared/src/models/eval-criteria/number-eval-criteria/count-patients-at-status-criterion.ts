import * as z from 'zod';
import { uuid } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    NumberEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newNumberEvalResult } from '../../../utils/eval-result/utils.js';
import type { PatientStatus } from '../../utils/patient-status.js';
import { patientStatusSchema } from '../../utils/patient-status.js';
import type { NumberEvalCriterion } from '../criterion-categories.js';
import { numberEvalCriterionBaseSchema } from '../eval-criterion-base.js';
import { Immutable } from 'immer';

export const countPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    targetStatus: patientStatusSchema,
    criterionType: z.literal('countPatientsAtStatusEvalCriterion'),
});
/** This is a number eval criterion with a target PatientStatus;
 * The respective EvalResult holds the count of patients with the specified status as real status.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
export type CountPatientsAtStatusEvalCriterion = Immutable<
    z.infer<typeof countPatientsAtStatusEvalCriterionSchema>
>;
export function newCountPatientsAtStatusEvalCriterion(
    name: string,
    targetStatus: PatientStatus
): CountPatientsAtStatusEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'countPatientsAtStatusEvalCriterion',
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
export function getEvalResultOfCountPatientsAtStatusCriterion(
    evalCriterion: CountPatientsAtStatusEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    const criterion = evalCriterion;
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
        criterion.id,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
