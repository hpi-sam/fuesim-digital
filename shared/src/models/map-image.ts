import { z } from 'zod';
import type { UUID } from '../utils/index.js';
import { uuid } from '../utils/index.js';
import {
    newMapPositionAt,
    imagePropertiesSchema,
    positionSchema,
} from './utils/index.js';
import type { MapCoordinates, ImageProperties } from './utils/index.js';
import type { MapImageTemplate } from './map-image-template.js';
export const mapImageSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('mapImage'),
    templateId: z.uuidv4(),
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
    };
}

export function newMapImageFromTemplate(
    template: MapImageTemplate,
    topLeft: MapCoordinates
): MapImage {
    return newMapImage(template.id, topLeft, template.image, false, 0);
}
