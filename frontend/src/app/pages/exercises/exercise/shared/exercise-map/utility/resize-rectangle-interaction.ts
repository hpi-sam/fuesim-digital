import type { Feature, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate.js';
import { distance } from 'ol/coordinate.js';
import BaseEvent from 'ol/events/Event.js';
import type { Polygon } from 'ol/geom.js';
import PointerInteraction from 'ol/interaction/Pointer.js';
import type VectorSource from 'ol/source/Vector.js';

/**
 * Provides the ability to resize a rectangle by dragging any of its corners.
 */
export class ResizeRectangleInteraction extends PointerInteraction {
    /**
     * The tolerance in coordinates for hitting a corner.
     */
    private readonly hitTolerance = 3;

    /**
     * Temporary values for the current resize operation.
     * If undefined no resize operation is currently in progress.
     */
    private currentResizeValues?: CurrentResizeValues;

    constructor(private readonly source: VectorSource<Feature<Polygon>>) {
        super({
            handleDownEvent: (event) => this._handleDownEvent(event),
            handleDragEvent: (event) => this._handleDragEvent(event),
            handleUpEvent: (event) => this._handleUpEvent(event),
        });
    }

    private _handleDownEvent(event: MapBrowserEvent<any>): boolean {
        const mouseCoordinate = event.coordinate;
        const feature =
            this.source.getClosestFeatureToCoordinate(mouseCoordinate);
        if (!feature) {
            return false;
        }
        const geometry = feature.getGeometry()!;
        const corners = geometry.getCoordinates()[0]!;
        const distances = corners.map((corner) =>
            distance(corner, mouseCoordinate)
        );
        const minDistance = Math.min(...distances);
        if (minDistance > this.hitTolerance) {
            // Only corners are relevant for us
            return false;
        }
        const nearestCorner = corners[distances.indexOf(minDistance)];
        const maxDistance = Math.max(...distances);
        const furthestCorner = corners[distances.indexOf(maxDistance)];
        if (nearestCorner === undefined || furthestCorner === undefined) {
            return false;
        }
        this.currentResizeValues = {
            draggedCorner: nearestCorner,
            originCorner: furthestCorner,
            feature,
            currentScale: { x: 1, y: 1 },
        };
        return true;
    }

    private _handleDragEvent(event: MapBrowserEvent<any>): boolean {
        if (this.currentResizeValues === undefined) {
            return false;
        }
        const mouseCoordinate = event.coordinate;
        const newXScale =
            (mouseCoordinate[0]! - this.currentResizeValues.originCorner[0]!) /
            (this.currentResizeValues.draggedCorner[0]! -
                this.currentResizeValues.originCorner[0]!);
        const newYScale =
            (this.currentResizeValues.originCorner[1]! - mouseCoordinate[1]!) /
            (this.currentResizeValues.originCorner[1]! -
                this.currentResizeValues.draggedCorner[1]!);
        this.currentResizeValues.feature
            .getGeometry()!
            .scale(
                newXScale / this.currentResizeValues.currentScale.x,
                newYScale / this.currentResizeValues.currentScale.y,
                this.currentResizeValues.originCorner
            );
        this.currentResizeValues.currentScale = { x: newXScale, y: newYScale };
        return true;
    }

    private _handleUpEvent(event: MapBrowserEvent<any>): boolean {
        if (this.currentResizeValues === undefined) {
            return true;
        }

        const coordinates = this.currentResizeValues.feature
            .getGeometry()!
            .getCoordinates()[0]!;
        const topLeftCoordinate = coordinates.reduce<Coordinate>(
            (smallestCoordinate, coordinate) =>
                coordinate[0]! <= smallestCoordinate[0]! ||
                coordinate[1]! >= smallestCoordinate[1]!
                    ? coordinate
                    : smallestCoordinate,
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
        );
        this.currentResizeValues.feature.dispatchEvent(
            new ResizeEvent(
                this.currentResizeValues.currentScale,
                this.currentResizeValues.originCorner,
                topLeftCoordinate
            )
        );
        this.currentResizeValues = undefined;
        return false;
    }

    static onResize(
        feature: Feature<Polygon>,
        callback: (event: ResizeEvent) => void
    ) {
        feature.addEventListener(
            resizeRectangleEventType,
            callback as (event: BaseEvent | Event) => void
        );
    }
}

interface CurrentResizeValues {
    draggedCorner: Coordinate;
    /**
     * The corner that doesn't move during the resize.
     */
    originCorner: Coordinate;
    /**
     * The feature that is currently being resized.
     */
    feature: Feature<Polygon>;
    currentScale: { x: number; y: number };
}

// TODO: This doesn't work as a static member of ResizeEvent, because it is undefined at runtime. Why?
const resizeRectangleEventType = 'resizerectangle';

class ResizeEvent extends BaseEvent {
    constructor(
        public readonly scale: { x: number; y: number },
        /**
         * The coordinate of the corner that didn't move during the resize.
         */
        public readonly origin: Coordinate,
        /**
         * The new top left coordinate of the rectangle.
         */
        public readonly topLeftCoordinate: Coordinate
    ) {
        super(resizeRectangleEventType);
    }
}
