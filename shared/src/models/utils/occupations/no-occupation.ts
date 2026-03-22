import { z } from 'zod';

export const noOccupationSchema = z.strictObject({
    type: z.literal('noOccupation'),
});

export type NoOccupation = z.infer<typeof noOccupationSchema>;

export function newNoOccupation(): NoOccupation {
    return {
        type: 'noOccupation',
    };
}
