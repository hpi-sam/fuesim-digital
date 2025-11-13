import * as z from 'zod';

export const noOccupationSchema = z.strictObject({
    type: z.literal('noOccupation'),
});

export interface NoOccupation {
    type: 'noOccupation';
}
