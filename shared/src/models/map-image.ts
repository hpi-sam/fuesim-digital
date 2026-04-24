import { z } from 'zod';
import { uuid, type UUID, uuidSchema } from '../utils/uuid.js';
import type { MapImageTemplate } from './map-image-template.js';
import { positionSchema } from './utils/position/position.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';
import type { MapCoordinates } from './utils/position/map-coordinates.js';
import { newMapPositionAt } from './utils/position/map-position.js';

export const mapImageSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('mapImage'),
    templateId: uuidSchema,
    position: positionSchema,
    image: imagePropertiesSchema,
    /**
     * Determines the rendering order among other mapImages.
     * A smaller number means the mapImage is behind another one.
     * The index can also be negative.
     * MapImages with the same zIndex don't have a defined order.
     */
    zIndex: z.int(),
    /**
     * Whether the UI should prevent position changes of the map image by drag&drop
     */
    isLocked: z.boolean(),
    scoutableId: uuidSchema.nullable(),
});

export type MapImage = z.infer<typeof mapImageSchema>;
export function newMapImage(
    templateId: UUID,
    topLeft: MapCoordinates,
    image: ImageProperties,
    isLocked: boolean,
    zIndex: number
): MapImage {
    return {
        id: uuid(),
        type: 'mapImage',
        templateId,
        position: newMapPositionAt(topLeft),
        image,
        isLocked,
        zIndex,
        scoutableId: null,
    };
}

export function newMapImageFromTemplate(
    template: MapImageTemplate,
    topLeft: MapCoordinates
): MapImage {
    return newMapImage(template.id, topLeft, template.image, false, 0);
}
