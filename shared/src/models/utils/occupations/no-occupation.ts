import * as z from 'zod';

export const noOccupationSchema = z.strictObject({
    type: z.literal('noOccupation'),
});

export type NoOccupation = z.infer<typeof noOccupationSchema>;

export const newNoOccupation = (): NoOccupation => ({
    type: 'noOccupation',
});
