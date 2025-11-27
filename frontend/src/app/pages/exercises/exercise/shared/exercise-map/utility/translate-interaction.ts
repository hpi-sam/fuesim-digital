import { isEqual } from 'lodash-es';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Point } from 'ol/geom';
import { Translate } from 'ol/interaction';
import type { GeometryWithCoordinates, Positions } from './geometry-helper';

/**
 * Translates (moves) a feature to a new position.
 *
 * It is different to the standard {@link Translate} interaction in the following ways:
 * * Clicking on an element doesn't trigger a `translateend` event - a `singleclick` interaction should be used instead
 * Be aware that this means that not every `translatestart` event will have an accompanying `translateend` event.
 * * More performant (see {@link handleMoveEvent})
 * * There are additional helper methods that can be used on features in layers that have this interaction:
 *     * onTranslateEnd
 */
export class TranslateInteraction extends Translate {
    constructor(...args: ConstructorParameters<typeof Translate>) {
        super(...args);
        // Clicking on an element shouldn't trigger a `translateend` event
        // This must be the first event listener to stop the event-propagation to following event listeners
        this.on('translateend', (event) => {
            if (isEqual(event.coordinate, event.startCoordinate)) {
                event.stopPropagation();
            }
        });
        // These event don't propagate to anything else by default.
        // We therefore have to propagate them manually to the specific features.
        const translateEvents = [
            'translatestart',
            'translating',
            'translateend',
        ] as const;
        for (const eventName of translateEvents) {
            this.on(eventName, (event) => {
                event.features.forEach((feature: Feature) => {
                    feature.dispatchEvent(event);
                });
            });
        }
    }

    /**
     * Calls {@link callback} with the new coordinates of the feature
     * every time the {@link feature} has been translated
     *
     * You can only call this function if the layer of the feature has this Interaction.
     */
    public static onTranslateEnd<T extends GeometryWithCoordinates = Point>(
        feature: Feature<T>,
        callback: (newCoordinates: Positions<T>) => void,
        getPosition: (feature: Feature<T>) => Positions<T>
    ) {
        feature.addEventListener('translateend', (event) => {
            // The end coordinates in the event are the mouse coordinates and not the feature coordinates.
            callback(getPosition(feature));
        });
    }

    protected override handleMoveEvent(
        mapBrowserEvent: MapBrowserEvent<any>
    ): void {
        // The original handleMoveEvent() is very computation expensive and
        // only sets some cursor classes on the map. We don't need this.
        // Therefore we override this handler with an empty one.
    }
}
