import type { WithPosition } from 'digital-fuesim-manv-shared';
import {
    MapCoordinates,
    currentCoordinatesOf,
} from 'digital-fuesim-manv-shared';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import type {
    CoordinatePair,
    Coordinates,
    GeometryHelper,
    Positions,
} from './geometry-helper';
import { interpolate } from './geometry-helper';

export class PointGeometryHelper implements GeometryHelper<Point> {
    create = (element: WithPosition): Feature<Point> =>
        new Feature(new Point(this.getElementCoordinates(element)));

    getElementCoordinates = (element: WithPosition): Coordinates<Point> => [
        currentCoordinatesOf(element).x,
        currentCoordinatesOf(element).y,
    ];

    getFeatureCoordinates = (feature: Feature<Point>): Coordinates<Point> =>
        feature.getGeometry()!.getCoordinates();

    interpolateCoordinates = (
        positions: CoordinatePair<Point>,
        progress: number
    ): Coordinates<Point> =>
        interpolate(positions.startPosition, positions.endPosition, progress);

    getFeaturePosition = (feature: Feature<Point>): Positions<Point> =>
        MapCoordinates.create(
            this.getFeatureCoordinates(feature)[0]!,
            this.getFeatureCoordinates(feature)[1]!
        );
}
