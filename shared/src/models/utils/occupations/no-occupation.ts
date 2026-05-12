import { z } from 'zod';
import type { Immutable } from 'immer';

export const noOccupationSchema = z.strictObject({
    type: z.literal('noOccupation'),
});

export type NoOccupation = Immutable<z.infer<typeof noOccupationSchema>>;

export function newNoOccupation(): NoOccupation {
    return {
        type: 'noOccupation',
    };
}
