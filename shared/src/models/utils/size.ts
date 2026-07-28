import { z } from 'zod';
import type { Immutable } from 'immer';

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

export type Size = Immutable<z.infer<typeof sizeSchema>>;

export function newSize(width: number, height: number): Size {
    return { width, height };
}
