import * as z from 'zod';

export const sizeSchema = z.strictObject({
    /**
     * The width in meters
     */
    width: z.number(),

    /**
     * The height in meters
     */
    height: z.number(),
});

export type Size = z.infer<typeof sizeSchema>;

export function newSize(width: number, height: number): Size {
    return { width, height };
}
