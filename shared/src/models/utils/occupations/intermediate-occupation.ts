import * as z from 'zod';

export const intermediateOccupationSchema = z.strictObject({
    type: z.literal('intermediateOccupation'),
    unoccupiedUntil: z.int().min(0),
});

export type IntermediateOccupation = z.infer<
    typeof intermediateOccupationSchema
>;
