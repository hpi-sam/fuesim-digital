import * as z from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { MapCoordinates } from './utils/position/map-coordinates.js';
import { mapCoordinatesSchema } from './utils/position/map-coordinates.js';
import { newMapPositionAt } from './utils/position/map-position.js';
import { positionSchema } from './utils/position/position.js';

export const drawingTypeSchema = z.literal(['freehand', 'line']);

export type DrawingType = z.infer<typeof drawingTypeSchema>;

export const drawingSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('drawing'),
    drawingType: drawingTypeSchema,
    position: positionSchema,
    points: z.array(mapCoordinatesSchema).min(2),
    strokeColor: z.string(),
    fillColor: z.string().optional(),
});

export type Drawing = z.infer<typeof drawingSchema>;

export function newDrawing(
    drawingType: DrawingType,
    points: readonly MapCoordinates[],
    strokeColor: string,
    fillColor?: string
): Drawing {
    if (points.length < 2) {
        throw new Error('Drawings require at least two points');
    }

    const [firstPoint] = points;

    return {
        id: uuid(),
        type: 'drawing',
        drawingType,
        position: newMapPositionAt(firstPoint!),
        points: [...points],
        strokeColor,
        fillColor,
    };
}
