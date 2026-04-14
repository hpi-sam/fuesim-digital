import { z } from 'zod';

export const radiogramStatusSchema = z.strictObject({
    type: z.literal('radiogramStatus'),
});
