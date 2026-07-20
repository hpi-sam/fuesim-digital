import z from 'zod';
import {
    EvalCriterion,
    EvalResult,
    EvalResultContext,
    newNumberEvalResult,
    NumberEvalCriterion,
    numberEvalCriterionBaseSchema,
    NumberEvalResult,
    uuid,
    UUID,
    uuidSchema,
} from 'fuesim-digital-shared';

export const countMeasuresEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countMeasuresEvalCriterion'),
    targetMeasureTemplateId: uuidSchema,
});
/** This is a number eval criterion with a target measure template by id;
 * The respective EvalResult holds the count of measures of the specified template.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
export type CountMeasuresEvalCriterion = z.infer<
    typeof countMeasuresEvalCriterionSchema
>;
export function newcountMeasuresEvalCriterion(
    name: string,
    targetMeasureTemplateId: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CountMeasuresEvalCriterion {
    return {
        id: uuid() as UUID,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
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
    const criterion = evalCriterion as CountMeasuresEvalCriterion;
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
        criterion.id as UUID,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
