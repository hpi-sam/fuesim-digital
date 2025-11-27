import type {
    MapCoordinates,
    Position,
    Size,
    UUID,
} from 'digital-fuesim-manv-shared';
import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Geometry } from 'ol/geom';

export interface PositionableElement {
    readonly id: UUID;
    readonly position: Position;
}

export type ResizableElement = PositionableElement & {
    size: Size;
};

export type GeometryWithCoordinates = Geometry & {
    getCoordinates: () => unknown;
    setCoordinates: (coordinates: any[]) => void;
};
/**
 * Typescript doesn't error when T doesn't satisfy
 * getCoordinates: () => unknown.
 * Instead, the inferred type is null. We exclude this type
 * to exchange it with never
 */
export type Coordinates<T extends GeometryWithCoordinates> = Exclude<
    ReturnType<T['getCoordinates']>,
    null
>;

type ArrayElement<ArrayType> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

type SubstituteCoordinateForPoint<T> = T extends Coordinate
    ? MapCoordinates
    : T extends Array<ArrayElement<T>>
      ? SubstituteCoordinateForPoint<ArrayElement<T>>[]
      : never;

export type Positions<T extends GeometryWithCoordinates> =
    SubstituteCoordinateForPoint<Coordinates<T>>;

export interface CoordinatePair<T extends GeometryWithCoordinates> {
    startPosition: Coordinates<T>;
    endPosition: Coordinates<T>;
}

export interface GeometryHelper<
    T extends GeometryWithCoordinates,
    Element extends PositionableElement = PositionableElement,
> {
    create: (element: Element) => Feature<T>;
    getElementCoordinates: (element: Element) => Coordinates<T>;
    getFeatureCoordinates: (feature: Feature<T>) => Coordinates<T>;
    interpolateCoordinates: (
        positions: CoordinatePair<T>,
        progress: number
    ) => Coordinates<T>;
    getFeaturePosition: (feature: Feature<T>) => Positions<T>;
}

export const interpolate = (
    startCoordinate: Coordinate,
    endCoordinate: Coordinate,
    lerpFactor: number
): Coordinate => [
    startCoordinate[0]! +
        (endCoordinate[0]! - startCoordinate[0]!) * lerpFactor,
    startCoordinate[1]! +
        (endCoordinate[1]! - startCoordinate[1]!) * lerpFactor,
];
