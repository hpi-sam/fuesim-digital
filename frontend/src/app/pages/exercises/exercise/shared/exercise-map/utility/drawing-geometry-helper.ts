import {
    type Drawing,
    newMapCoordinatesAt,
    type MapCoordinates,
} from 'fuesim-digital-shared';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { LineString, Polygon } from 'ol/geom';
import type {
    CoordinatePair,
    Coordinates,
    GeometryHelper,
    Positions,
} from './geometry-helper';
import { interpolate } from './geometry-helper';

function toCoordinate(point: MapCoordinates): Coordinate {
    return [point.x, point.y];
}

function closeRing(ring: Coordinate[]): Coordinate[] {
    if (ring.length === 0) {
        return ring;
    }
    const first = ring[0]!;
    const last = ring.at(-1)!;
    if (first[0] === last[0] && first[1] === last[1]) {
        return ring;
    }
    return [...ring, [...first]];
}

export class DrawingGeometryHelper implements GeometryHelper<
    LineString | Polygon,
    Drawing
> {
    create(element: Drawing): Feature<LineString | Polygon> {
        const coords = element.points.map(toCoordinate);
        const geometry =
            element.drawingType === 'freehand'
                ? new Polygon([closeRing(coords)])
                : new LineString(coords);
        return new Feature(geometry);
    }

    getElementCoordinates(element: Drawing): Coordinates<LineString | Polygon> {
        const coords = element.points.map(toCoordinate);
        return (
            element.drawingType === 'freehand' ? [closeRing(coords)] : coords
        ) as Coordinates<LineString | Polygon>;
    }

    getFeatureCoordinates(
        feature: Feature<LineString | Polygon>
    ): Coordinates<LineString | Polygon> {
        return feature.getGeometry()!.getCoordinates();
    }

    interpolateCoordinates(
        positions: CoordinatePair<LineString | Polygon>,
        progress: number
    ): Coordinates<LineString | Polygon> {
        const start = positions.startPosition;
        const end = positions.endPosition;

        // Polygon coordinates: number[][][] (array of rings)
        if (Array.isArray(start[0]) && Array.isArray(start[0][0])) {
            return (start as Coordinate[][]).map(
                (ring: Coordinate[], ringIndex: number) =>
                    ring.map((startCoord: Coordinate, coordIndex: number) =>
                        interpolate(
                            startCoord,
                            (end as Coordinate[][])[ringIndex]![coordIndex]!,
                            progress
                        )
                    )
            );
        }

        // LineString coordinates: number[][]
        return (start as Coordinate[]).map(
            (startCoord: Coordinate, index: number) =>
                interpolate(startCoord, (end as Coordinate[])[index]!, progress)
        );
    }

    getFeaturePosition(
        feature: Feature<LineString | Polygon>
    ): Positions<LineString | Polygon> {
        const geometry = feature.getGeometry()!;
        const coords = geometry.getCoordinates();

        if (geometry instanceof Polygon) {
            return (coords as Coordinate[][]).map((ring: Coordinate[]) =>
                ring.map((coord: Coordinate) =>
                    newMapCoordinatesAt(coord[0]!, coord[1]!)
                )
            );
        }
        // LineString
        return (coords as Coordinate[]).map((coord: Coordinate) =>
            newMapCoordinatesAt(coord[0]!, coord[1]!)
        );
    }
}
