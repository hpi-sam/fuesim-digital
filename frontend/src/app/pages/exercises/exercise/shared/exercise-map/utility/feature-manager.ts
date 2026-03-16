import type { Feature, MapBrowserEvent } from 'ol';
import type { Geometry } from 'ol/geom';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type VectorLayer from 'ol/layer/Vector';
import type { Subject } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from 'fuesim-digital-shared';
import type { OlMapInteractionsManager } from './ol-map-interactions-manager';

/**
 * The Api to interact with a feature
 */
export interface FeatureManager<T extends Geometry> {
    readonly layer: VectorLayer;

    /**
     * This method is called when the user clicks on a feature on this layer.
     * @param event The click event that triggered the call
     * @param feature The feature that was clicked on
     */
    onFeatureClicked: (
        event: MapBrowserEvent<any>,
        feature: Feature<T>
    ) => void;

    /**
     * @returns whether the feature can be moved by the user
     */
    isFeatureTranslatable: (feature: Feature<T>) => boolean;

    /**
     * @param dropEvent The drop event that triggered the call
     * @param droppedFeature is dropped on {@link droppedOnFeature}
     * @param droppedOnFeature is the feature that {@link droppedFeature} is dropped on
     * @returns wether the event should not propagate further (to the features behind {@link droppedOnFeature}).
     */
    onFeatureDrop: (
        droppedElement: Element,
        droppedOnFeature: Feature<T>,
        dropEvent?: TranslateEvent
    ) => boolean;

    register: (
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) => void;
}
