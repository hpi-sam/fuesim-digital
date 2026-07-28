import { z } from 'zod';
import type { Immutable } from 'immer';

export const noPositionSchema = z.strictObject({
    type: z.literal('no'),
});

/**
 * A null-object for cases in which a position is needed.
 * Can be used to indicate that an element is not yet part of the exercise.
 */
export type NoPosition = Immutable<z.infer<typeof noPositionSchema>>;

export function newNoPosition(): NoPosition {
    return {
        type: 'no',
    };
}
