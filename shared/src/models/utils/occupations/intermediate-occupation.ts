import * as z from 'zod';

export const intermediateOccupationSchema = z.strictObject({
    type: z.literal('intermediateOccupation'),
    unoccupiedUntil: z.int().nonnegative(),
});

export type IntermediateOccupation = z.infer<
    typeof intermediateOccupationSchema
>;

export const newIntermediateOccupation = (
    unoccupiedUntil: number
): IntermediateOccupation => ({
    type: 'intermediateOccupation',
    unoccupiedUntil,
});
