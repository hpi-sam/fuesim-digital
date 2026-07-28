import { z } from 'zod';
import type { Immutable } from 'immer';

export const mapCoordinatesSchema = z.strictObject({
    x: z.number(),
    y: z.number(),
});

export type MapCoordinates = Immutable<z.infer<typeof mapCoordinatesSchema>>;

export function newMapCoordinatesAt(x: number, y: number): MapCoordinates {
    return {
        x,
        y,
    };
}
