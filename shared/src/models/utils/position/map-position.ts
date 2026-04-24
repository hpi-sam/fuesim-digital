import { z } from 'zod';
import type { MapCoordinates } from './map-coordinates.js';
import { mapCoordinatesSchema } from './map-coordinates.js';

export const mapPositionSchema = z.strictObject({
    /** @deprecated use {@link isOnMap} */
    type: z.literal('coordinates'),
    /** @deprecated use {@link currentCoordinatesOf} */
    coordinates: mapCoordinatesSchema,
});

export type MapPosition = z.infer<typeof mapPositionSchema>;

export function newMapPositionAt(coordinates: MapCoordinates): MapPosition {
    return {
        type: 'coordinates',
        coordinates,
    };
}
