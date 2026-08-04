import * as z from 'zod';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    NumberEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newNumberEvalResult } from '../../../utils/eval-result/utils.js';
import type { NumberEvalCriterion } from '../criterion-categories.js';
import { numberEvalCriterionBaseSchema } from '../eval-criterion-base.js';
import { Immutable } from 'immer';

export const countMeasuresEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countMeasuresEvalCriterion'),
    targetMeasureTemplateId: uuidSchema,
});
/** This is a number eval criterion with a target measure template by id;
 * The respective EvalResult holds the count of measures of the specified template.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
export type CountMeasuresEvalCriterion = Immutable<
    z.infer<typeof countMeasuresEvalCriterionSchema>
>;
export function newcountMeasuresEvalCriterion(
    name: string,
    targetMeasureTemplateId: UUID
): CountMeasuresEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'countMeasuresEvalCriterion',
        targetMeasureTemplateId,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfCountMeasuresCriterion(
    evalCriterion: CountMeasuresEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    const criterion = evalCriterion;
    let num = null;
    /* TODO @JohannesPotzi @Jogius : implementation*/
    console.log('TODO: implement evaluation of countMeasuresEvalCriterion');
    num = -1;
    if (!num) {
        console.log(
            `[logic Error]: trying to return result of numberCriterion${
                criterion.id
            } without calculating the number value. The critrerionType is : ${criterion.criterionType}`
        );
        num = -1;
    }
    return newNumberEvalResult(
        criterion.id,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
