import type { Store } from '@ngrx/store';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from 'fuesim-digital-shared';
import type { MapBrowserEvent } from 'ol';
import { Feature } from 'ol';
import LineString from 'ol/geom/LineString';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type { Subject } from 'rxjs';
import type { TransferLinesService } from '../../core/transfer-lines.service';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import type { TransferLine } from '../../../../../../shared/types/transfer-line';
import type { AppState } from '../../../../../../state/app.state';
import { selectTransferLines } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { ElementManager } from './element-manager';

export class TransferLinesFeatureManager
    extends ElementManager<TransferLine, LineString>
    implements FeatureManager<LineString>
{
    public readonly layer: VectorLayer;
    constructor(
        private readonly store: Store<AppState>,
        private readonly transferLinesService: TransferLinesService,
        private readonly olMap: OlMap
    ) {
        super();
        this.layer = this.createElementLayer<LineString>();
        this.layer.setStyle(
            new Style({
                stroke: new Stroke({
                    color: '#fd7e14',
                    // We don't want to scale with the zoom to be better seen when zoomed out
                    width: 3,
                }),
            })
        );
    }
    register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) {
        this.olMap.addLayer(this.layer);
        mapInteractionsManager.addFeatureLayer(this.layer);
        if (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        ) {
            this.registerChangeHandlers(
                this.store.select(selectTransferLines),
                destroy$,
                (element) => this.onElementCreated(element),
                (element) => this.onElementDeleted(element),
                (oldElement, newElement) =>
                    this.onElementChanged(oldElement, newElement)
            );
            this.transferLinesService.displayTransferLines$.subscribe(
                (display) => {
                    this.layer.setVisible(display);
                }
            );
        }
    }

    createFeature(element: TransferLine): Feature<LineString> {
        const feature = new Feature(
            new LineString([
                [element.startPosition.x, element.startPosition.y],
                [element.endPosition.x, element.endPosition.y],
            ])
        );
        feature.setId(element.id);
        this.layer.getSource()!.addFeature(feature);
        return feature;
    }

    deleteFeature(
        element: TransferLine,
        elementFeature: Feature<LineString>
    ): void {
        this.layer.getSource()!.removeFeature(elementFeature);
    }

    changeFeature(
        oldElement: TransferLine,
        newElement: TransferLine,
        changedProperties: ReadonlySet<keyof TransferLine>,
        elementFeature: Feature<LineString>
    ): void {
        // Rendering the line again is expensive, so we only do it if we must
        if (
            changedProperties.has('startPosition') ||
            changedProperties.has('endPosition')
        ) {
            elementFeature.getGeometry()!.setCoordinates([
                [newElement.startPosition.x, newElement.startPosition.y],
                [newElement.endPosition.x, newElement.endPosition.y],
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
        dropEvent: MouseEvent | TranslateEvent
    ) {
        return false;
    }

    getFeatureFromElement(element: TransferLine) {
        return this.layer.getSource()!.getFeatureById(element.id) ?? undefined;
    }

    isFeatureTranslatable(feature: Feature<LineString>) {
        return false;
    }
}
