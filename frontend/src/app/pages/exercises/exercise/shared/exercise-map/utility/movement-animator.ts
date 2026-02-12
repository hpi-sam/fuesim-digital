import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import type RenderEvent from 'ol/render/Event';
import type { Feature } from 'ol';
import { getVectorContext } from 'ol/render';
import type { UUID } from 'fuesim-digital-shared';
import { isEqual } from 'lodash-es';
import type {
    Coordinates,
    CoordinatePair,
    GeometryWithCoordinates,
} from './geometry-helper';

/**
 * Animates the movement of a feature to a new position.
 */
export class MovementAnimator<T extends GeometryWithCoordinates> {
    /**
     * The time in milliseconds how long the moving animation should take
     */
    private readonly movementAnimationTime = 200;

    constructor(
        private readonly olMap: OlMap,
        private readonly layer: VectorLayer,
        private readonly interpolateCoordinates: (
            positions: CoordinatePair<T>,
            progress: number
        ) => Coordinates<T>,
        private readonly getCoordinates: (feature: Feature<T>) => Coordinates<T>
    ) {}

    /**
     * This map stores the listeners for each feature to be able to unsubscribe them.
     */
    private readonly animationListeners = new Map<
        UUID,
        (event: RenderEvent) => void
    >();

    /**
     * This method animates the movement of the feature from its current position to the given end position
     * by linearly interpolating it's position over the next {@link movementAnimationTime} milliseconds.
     *
     * If the feature is removed from the layer before the animation is finished, it is recommended to call {@link stopMovementAnimation}.
     */
    public animateFeatureMovement(
        feature: Feature<T>,
        endPosition: Coordinates<T>
    ) {
        const startTime = Date.now();
        const startPosition = this.getCoordinates(feature);
        this.stopMovementAnimation(feature);
        if (isEqual(startPosition, endPosition)) {
            return;
        }
        const listener = (event: RenderEvent) => {
            this.animationTick(
                event,
                startTime,
                { startPosition, endPosition },
                feature
            );
        };
        this.animationListeners.set(this.getFeatureId(feature), listener);
        // The listener unsubscribes itself
        this.layer.on('postrender', listener);
        // Trigger the first animation tick
        this.olMap.render();
    }

    private setCoordinates(featureGeometry: T, coordinates: Coordinates<T>) {
        // The ol typings are incorrect
        featureGeometry.setCoordinates(coordinates as any);
    }

    /**
     * This method should be called after each postrender event.
     * It sets the feature to the next interpolated position.
     */
    private animationTick(
        event: RenderEvent,
        startTime: number,
        positions: CoordinatePair<T>,
        feature: Feature<T>
    ) {
        const featureGeometry = feature.getGeometry()!;
        const elapsedTime = event.frameState!.time - startTime;
        // A value between 0 and 1
        const progress = Math.max(
            Math.min(elapsedTime / this.movementAnimationTime, 1),
            0
        );
        // We should already be (nearly) at the end position
        if (progress >= 1) {
            this.stopMovementAnimation(feature);
            this.setCoordinates(featureGeometry, positions.endPosition);
            this.olMap.render();
            return;
        }
        const nextPosition = this.interpolateCoordinates(positions, progress);
        this.setCoordinates(featureGeometry, nextPosition);
        getVectorContext(event).drawGeometry(featureGeometry);
        this.olMap.render();
    }

    public stopMovementAnimation(feature: Feature<T>) {
        const listenerId = this.getFeatureId(feature);
        if (!this.animationListeners.has(listenerId)) {
            return;
        }
        this.layer.un('postrender', this.animationListeners.get(listenerId)!);
        this.animationListeners.delete(listenerId);
    }

    private getFeatureId(feature: Feature<T>) {
        // TODO: handle features without an id
        return feature.getId()! as UUID;
    }
}
