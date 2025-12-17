import * as z from 'zod';

export const mapCoordinatesSchema = z.strictObject({
    x: z.number(),
    y: z.number(),
});

export type MapCoordinates = z.infer<typeof mapCoordinatesSchema>;
