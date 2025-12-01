import {
    currentCoordinatesOf,
    MapCoordinates,
} from 'digital-fuesim-manv-shared';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import type {
    CoordinatePair,
    Coordinates,
    GeometryHelper,
    Positions,
    ResizableElement,
} from './geometry-helper';
import { interpolate } from './geometry-helper';

export class PolygonGeometryHelper
    implements GeometryHelper<Polygon, ResizableElement>
{
    create = (element: ResizableElement): Feature<Polygon> =>
        new Feature(new Polygon(this.getElementCoordinates(element)));

    getElementCoordinates = (
        element: ResizableElement
    ): Coordinates<Polygon> => [
        [
            [currentCoordinatesOf(element).x, currentCoordinatesOf(element).y],
            [
                currentCoordinatesOf(element).x + element.size.width,
                currentCoordinatesOf(element).y,
            ],
            [
                currentCoordinatesOf(element).x + element.size.width,
                currentCoordinatesOf(element).y - element.size.height,
            ],
            [
                currentCoordinatesOf(element).x,
                currentCoordinatesOf(element).y - element.size.height,
            ],
            [currentCoordinatesOf(element).x, currentCoordinatesOf(element).y],
        ],
    ];

    getFeatureCoordinates = (feature: Feature<Polygon>): Coordinates<Polygon> =>
        feature.getGeometry()!.getCoordinates();

    interpolateCoordinates = (
        positions: CoordinatePair<Polygon>,
        progress: number
    ): Coordinates<Polygon> =>
        positions.startPosition.map((coordinates, coordinatesIndex) =>
            coordinates.map((startCoordinate, coordinateIndex) =>
                interpolate(
                    startCoordinate,
                    positions.endPosition[coordinatesIndex]![coordinateIndex]!,
                    progress
                )
            )
        );

    getFeaturePosition = (feature: Feature<Polygon>): Positions<Polygon> =>
        this.getFeatureCoordinates(feature).map((coordinates) =>
            coordinates.map((coordinate) =>
                MapCoordinates.create(coordinate[0]!, coordinate[1]!)
            )
        );
}
