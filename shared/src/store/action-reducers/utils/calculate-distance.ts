import type { MapCoordinates } from '../../../models/utils/position/map-coordinates.js';

/**
 * @returns the distance between the two positions in meters.
 */
export function calculateDistance(a: MapCoordinates, b: MapCoordinates) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
