import type { Subject } from 'rxjs';
import type OlMap from 'ol/Map';
import type { Store } from '@ngrx/store';
import type { MapBrowserEvent } from 'ol';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import type VectorLayer from 'ol/layer/Vector';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element, ScoutableElement } from 'fuesim-digital-shared';
import { newImageProperties } from 'fuesim-digital-shared';
import type { TranslateEvent } from 'ol/interaction/Translate';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { selectVisibleScoutIndicators } from '../../../../../../state/application/selectors/shared.selectors';
import type { PopupService } from '../utility/popup.service';
import type { AppState } from '../../../../../../state/app.state';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import type { FeatureManager } from '../utility/feature-manager';
import type { ScoutableIndicator } from '../../../../../../shared/types/scoutable-indicator';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { ImagePopupHelper } from '../utility/popup-helper';
import { elementTypeNameCreateSelectorDectionary } from '../../../../../../state/application/selectors/exercise.selectors';
import type { OlMapManager } from '../utility/ol-map-manager';
import type { MoveableFeatureManager } from './moveable-feature-manager';
import { ElementManager } from './element-manager';
import type { PatientFeatureManager } from './patient-feature-manager';
import type { MapImageFeatureManager } from './map-images-feature-manager';

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
            this.store.select(selectVisibleScoutIndicators),
            destroy$,
            (element) => this.onElementCreated(element),
            (element) => this.onElementDeleted(element),
            (oldElement, newElement) =>
                this.onElementChanged(oldElement, newElement)
        );
    }
    private readonly imageStyleHelper = new ImageStyleHelper((feature) =>
        /* TODO @JohannesPotzi : add a magnifying glass svg (with license) */
        newImageProperties('/assets/Magnifying-glass.svg', 40, 313 / 427)
    );
    public readonly layer: VectorLayer;
    private readonly popupHelper: ImagePopupHelper;

    constructor(
        private readonly store: Store<AppState>,
        private readonly olMap: OlMap,
        private readonly popupService: PopupService,
        private readonly exerciseService: ExerciseService,
        private readonly patientFeatureManager: PatientFeatureManager,
        private readonly mapImageFeatureManager: MapImageFeatureManager,
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

        this.popupHelper = new ImagePopupHelper(this.olMap, this.layer);
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
        const scoutableElement = selectStateSnapshot(
            elementTypeNameCreateSelectorDectionary.get(type)!(
                indicatorElement.scoutableElementId
            ),
            this.store
        ) as ScoutableElement;

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
        dropEvent?: TranslateEvent
    ) {
        return false;
    }
}
