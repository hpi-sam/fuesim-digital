import type { Store } from '@ngrx/store';
import type { MapBrowserEvent } from 'ol';
import { Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from 'fuesim-digital-shared';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { LineStyleHelper } from '../utility/style-helper/line-style-helper';
import { rgbColorPalette } from '../../../../../../shared/functions/colors';
import type { CateringLine } from '../../../../../../shared/types/catering-line';
import type { AppState } from '../../../../../../state/app.state';
import { selectVisibleCateringLines } from '../../../../../../state/application/selectors/shared.selectors';
import { ElementManager } from './element-manager';

export class CateringLinesFeatureManager
    extends ElementManager<CateringLine, LineString>
    implements FeatureManager<LineString>
{
    private readonly lineStyleHelper = new LineStyleHelper(
        (feature) => ({
            color: rgbColorPalette.cyan,
        }),
        0.05
    );
    public readonly layer: VectorLayer;

    constructor(
        private readonly store: Store<AppState>,
        private readonly olMap: OlMap
    ) {
        super();
        this.layer = super.createElementLayer<LineString>();
        this.layer.setStyle((feature, currentZoom) =>
            this.lineStyleHelper.getStyle(feature as Feature, currentZoom)
        );
    }
    register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) {
        this.olMap.addLayer(this.layer);
        mapInteractionsManager.addFeatureLayer(this.layer);
        // Propagate the changes on an element to the featureManager
        this.registerChangeHandlers(
            this.store.select(selectVisibleCateringLines),
            destroy$,
            (element) => this.onElementCreated(element),
            (element) => this.onElementDeleted(element),
            (oldElement, newElement) =>
                this.onElementChanged(oldElement, newElement)
        );
    }

    public isFeatureTranslatable(feature: Feature<LineString>) {
        return false;
    }

    createFeature(element: CateringLine): Feature<LineString> {
        const feature = new Feature(
            new LineString([
                [element.catererPosition.x, element.catererPosition.y],
                [element.patientPosition.x, element.patientPosition.y],
            ])
        );
        feature.setId(element.id);
        this.layer.getSource()!.addFeature(feature);
        return feature;
    }

    deleteFeature(
        element: CateringLine,
        elementFeature: Feature<LineString>
    ): void {
        this.layer.getSource()!.removeFeature(elementFeature);
    }

    changeFeature(
        oldElement: CateringLine,
        newElement: CateringLine,
        changedProperties: ReadonlySet<keyof CateringLine>,
        elementFeature: Feature<LineString>
    ): void {
        // Rendering the line again is expensive, so we only do it if we must
        if (
            changedProperties.has('catererPosition') ||
            changedProperties.has('patientPosition')
        ) {
            elementFeature.getGeometry()!.setCoordinates([
                [newElement.catererPosition.x, newElement.catererPosition.y],
                [newElement.patientPosition.x, newElement.patientPosition.y],
            ]);
        }
    }

    onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<LineString>
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ) {}

    onFeatureDrop(
        droppedElement: Element,
        droppedOnFeature: Feature<LineString>,
        dropEvent?: TranslateEvent
    ) {
        return false;
    }

    getFeatureFromElement(element: CateringLine) {
        return this.layer.getSource()!.getFeatureById(element.id) ?? undefined;
    }
}
