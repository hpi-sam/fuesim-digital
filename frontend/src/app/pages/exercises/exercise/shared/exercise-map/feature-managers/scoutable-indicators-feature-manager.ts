import type { Subject } from 'rxjs';
import type OlMap from 'ol/Map';
import type { Store } from '@ngrx/store';
import type { MapBrowserEvent } from 'ol';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import type VectorLayer from 'ol/layer/Vector';

import type {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
    ScoutableElement,
    ScoutableElementType,
} from 'fuesim-digital-shared';
import { newImageProperties } from 'fuesim-digital-shared';
import type { TranslateEvent } from 'ol/interaction/Translate';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { selectVisibleScoutableIndicators } from '../../../../../../state/application/selectors/shared.selectors';
import type { AppState } from '../../../../../../state/app.state';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import type { FeatureManager } from '../utility/feature-manager';
import type { ScoutableIndicator } from '../../../../../../shared/types/scoutable-indicator';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { scoutableElementTypeSelectorMap } from '../../../../../../state/application/selectors/exercise.selectors';
import type { OlMapManager } from '../utility/ol-map-manager';
import type { MoveableFeatureManager } from './moveable-feature-manager';
import { ElementManager } from './element-manager';

export class ScoutableIndicatorsFeatureManager
    extends ElementManager<ScoutableIndicator, Point>
    implements FeatureManager<Point>
{
    override createFeature(element: ScoutableIndicator): Feature<Point> {
        const feature = new Feature(
            new Point([element.position.x, element.position.y])
        );
        feature.setId(element.id);
        this.layer.getSource()!.addFeature(feature);
        return feature;
    }

    override deleteFeature(
        element: ScoutableIndicator,
        elementFeature: Feature<Point>
    ): void {
        this.layer.getSource()!.removeFeature(elementFeature);
    }

    override changeFeature(
        oldElement: ScoutableIndicator,
        newElement: ScoutableIndicator,
        changedProperties: ReadonlySet<keyof ScoutableIndicator>,
        elementFeature: Feature<Point>
    ): void {
        // Rendering the indicator again is expensive, so we only do it if we must
        if (changedProperties.has('position')) {
            elementFeature
                .getGeometry()!
                .setCoordinates([newElement.position.x, newElement.position.y]);
        }
    }

    override getFeatureFromElement(
        element: ScoutableIndicator
    ): Feature<Point> | undefined {
        return this.layer.getSource()!.getFeatureById(element.id) ?? undefined;
    }

    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        this.olMap.addLayer(this.layer);
        mapInteractionsManager.addFeatureLayer(this.layer);
        // Propagate the changes on an element to the featureManager
        this.registerChangeHandlers(
            this.store.select(selectVisibleScoutableIndicators),
            destroy$,
            (element) => this.onElementCreated(element),
            (element) => this.onElementDeleted(element),
            (oldElement, newElement) =>
                this.onElementChanged(oldElement, newElement)
        );
    }
    private readonly imageStyleHelper = new ImageStyleHelper((feature) => {
        const indicatorElement = this.getElementFromFeature(
            feature
        ) as ScoutableIndicator;

        return newImageProperties(
            indicatorElement.imageUrl,
            indicatorElement.height,
            1
        );
    });
    public readonly layer: VectorLayer;

    constructor(
        private readonly store: Store<AppState>,
        private readonly olMap: OlMap,
        private readonly olMapManager: OlMapManager
    ) {
        super();
        this.layer = super.createElementLayer();

        this.layer.setStyle((feature, resolution) => {
            const style = this.imageStyleHelper.getStyle(
                feature as Feature,
                resolution
            );
            return style;
        });
    }

    getScoutableElementFromIndicator<T extends ScoutableElementType>(
        indicator: ScoutableIndicator & { scoutableElementType: T }
    ): ScoutableElement & { type: T } {
        return selectStateSnapshot(
            scoutableElementTypeSelectorMap[indicator.scoutableElementType](
                indicator.scoutableElementId
            ),
            this.store
        ) as ScoutableElement & { type: T };
    }

    onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<Point>
    ): void {
        const indicatorElement = this.getElementFromFeature(
            feature
        ) as ScoutableIndicator;
        const type = indicatorElement.scoutableElementType;
        const popupFeatureManager =
            this.olMapManager.featureNameFeatureManagerDictionary.get(
                type
            ) as MoveableFeatureManager<ScoutableElement>;

        const scoutableElement =
            this.getScoutableElementFromIndicator(indicatorElement);

        const popupFeature =
            popupFeatureManager.getFeatureFromElement(scoutableElement)!;
        popupFeature.setId(scoutableElement.id);
        popupFeatureManager.onFeatureClicked(event, popupFeature, true);
    }

    isFeatureTranslatable(feature: Feature<Point>) {
        return false;
    }

    onFeatureDrop(
        droppedElement: Element,
        droppedOnFeature: Feature<Point>,
        dropEvent?: MouseEvent | TranslateEvent
    ) {
        return false;
    }
}
