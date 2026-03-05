import { z } from 'zod';
import { uuid } from '../utils/index.js';
import {
    lowerRightCornerOf,
    upperLeftCornerOf,
    sizeSchema,
    positionSchema,
    newMapPositionAt,
} from './utils/index.js';
import type { ImageProperties, MapCoordinates, Size } from './utils/index.js';

export const viewportSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('viewport'),
    position: positionSchema,
    size: sizeSchema,
    name: z.string(),
});
export type Viewport = z.infer<typeof viewportSchema>;

export const viewportImage: ImageProperties = {
    url: 'assets/viewport.svg',
    height: 1800,
    aspectRatio: 1600 / 900,
};

// This ratio has been determined by trial and error
export const defaultViewportSize: Size = {
    height: viewportImage.height / 23.5,
    width: (viewportImage.height / 23.5) * viewportImage.aspectRatio,
};

export function newViewport(position: MapCoordinates, name: string): Viewport {
    return {
        id: uuid(),
        type: 'viewport',
        position: newMapPositionAt(position),
        size: defaultViewportSize,
        name,
    };
}

export function isInViewport(
    viewport: Viewport,
    position: MapCoordinates
): boolean {
    const upperLeftCorner = upperLeftCornerOf(viewport);
    const lowerRightCorner = lowerRightCornerOf(viewport);
    return (
        upperLeftCorner.x <= position.x &&
        position.x <= lowerRightCorner.x &&
        lowerRightCorner.y <= position.y &&
        position.y <= upperLeftCorner.y
    );
}
