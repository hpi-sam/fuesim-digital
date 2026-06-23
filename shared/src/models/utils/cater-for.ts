import { z } from 'zod';

export const logicalOperatorSchema = z.literal(['and', 'or']);
export type LogicalOperator = z.infer<typeof logicalOperatorSchema>;

export const canCaterForSchema = z.strictObject({
    /**
     * if {@link logicalOperator}  `=== 'and'` it is cumulative,
     * how many red patients can the catering treat
     * also affects the number of possible {@link yellow} and {@link green} patients
     * that can be treated.
     */
    red: z.int().min(0),
    /**
     * if {@link logicalOperator}  `=== 'and'` it is cumulative,
     * how many extra {@link yellow} and {@link green} patients can the catering treat
     * to the number already written in the {@link red} value
     */
    yellow: z.int().min(0),
    /**
     * if {@link logicalOperator}  `=== 'and'` it is cumulative,
     * how many {@link green} patients can the catering treat
     * to the number already written in the {@link yellow} and {@link red} value
     */
    green: z.int().min(0),
    logicalOperator: logicalOperatorSchema,
});
export type CanCaterFor = z.infer<typeof canCaterForSchema>;

export function newCanCaterFor(
    red: number,
    yellow: number,
    green: number,
    logicalOperator: LogicalOperator
): CanCaterFor {
    return {
        red,
        yellow,
        green,
        logicalOperator,
    };
}
