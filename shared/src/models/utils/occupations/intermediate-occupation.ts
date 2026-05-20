import { z } from 'zod';
import type { Immutable } from 'immer';

export const intermediateOccupationSchema = z.strictObject({
    type: z.literal('intermediateOccupation'),
    unoccupiedUntil: z.int().nonnegative(),
});

export type IntermediateOccupation = Immutable<
    z.infer<typeof intermediateOccupationSchema>
>;

export function newIntermediateOccupation(
    unoccupiedUntil: number
): IntermediateOccupation {
    return {
        type: 'intermediateOccupation',
        unoccupiedUntil,
    };
}
