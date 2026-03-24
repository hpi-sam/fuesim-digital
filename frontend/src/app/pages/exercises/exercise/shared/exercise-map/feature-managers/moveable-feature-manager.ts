import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import type { Observable, Subject } from 'rxjs';
import type { Element as StateElement, UUID } from 'fuesim-digital-shared';
import type { FeatureLike } from 'ol/Feature';
import type Style from 'ol/style/Style';
import type { FeatureManager } from '../utility/feature-manager';
import type {
    GeometryHelper,
    GeometryWithCoordinates,
    PositionableElement,
    Positions,
} from '../utility/geometry-helper';
import { MovementAnimator } from '../utility/movement-animator';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { TranslateInteraction } from '../utility/translate-interaction';
import { selectCurrentMainRole } from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type { PopupService } from '../utility/popup.service';
import { ElementManager } from './element-manager';

/**
 * Manages the position of the element.
 * Manages the default interactions of the element.
 * Automatically redraws a feature (= reevaluates its style function) when an element property has changed.
 */
export abstract class MoveableFeatureManager<
        ManagedElement extends PositionableElement,
        FeatureType extends GeometryWithCoordinates = Point,
    >
    extends ElementManager<ManagedElement, FeatureType>
    implements FeatureManager<FeatureType>
{
    public readonly movementAnimator: MovementAnimator<FeatureType>;
    public layer: VectorLayer;
    protected constructor(
        protected readonly olMap: OlMap,
        private readonly proposeMovementAction: (
            newPosition: Positions<FeatureType>,
            element: ManagedElement
        ) => Promise<{ success: boolean }>,
        public readonly geometryHelper: GeometryHelper<
            FeatureType,
            ManagedElement
        >,
        renderBuffer?: number
    ) {
        super();
        this.layer = super.createElementLayer<FeatureType>(renderBuffer);
        this.movementAnimator = this.createMovementAnimator();
    }

    createMovementAnimator() {
        return new MovementAnimator<FeatureType>(
            this.olMap,
            this.layer,
            this.geometryHelper.interpolateCoordinates,
            this.geometryHelper.getFeatureCoordinates
        );
    }

    /**
     * Callback called on {@link TranslateInteraction.onTranslateEnd}.
     * @protected
     */
    protected async onTranslateEnd(
        newPosition: Positions<FeatureType>,
        element: ManagedElement,
        elementFeature: Feature<FeatureType>
    ) {
        if (!(await this.proposeMovementAction(newPosition, element)).success) {
            // Roll back movement if it wasn't successful
            const oldPosition =
                this.geometryHelper.getElementCoordinates(element);
            this.movementAnimator.animateFeatureMovement(
                elementFeature,
                oldPosition
            );
            elementFeature.changed();
        }
    }

    createFeature(element: ManagedElement): Feature<FeatureType> {
        const elementFeature = this.geometryHelper.create(element);
        elementFeature.setId(element.id);
        this.layer.getSource()!.addFeature(elementFeature);
        TranslateInteraction.onTranslateEnd<FeatureType>(
            elementFeature,
            async (newCoordinates) =>
                this.onTranslateEnd(newCoordinates, element, elementFeature),
            this.geometryHelper.getFeaturePosition
        );
        return elementFeature;
    }

    isFeatureTranslatable(feature: Feature<FeatureType>) {
        return true;
    }

    deleteFeature(
        element: ManagedElement,
        elementFeature: Feature<FeatureType>
    ): void {
        this.layer.getSource()!.removeFeature(elementFeature);
        elementFeature.dispose();
        this.movementAnimator.stopMovementAnimation(elementFeature);
    }

    changeFeature(
        oldElement: ManagedElement,
        newElement: ManagedElement,
        changedProperties: ReadonlySet<keyof ManagedElement>,
        elementFeature: Feature<FeatureType>
    ): void {
        if (changedProperties.has('position')) {
            this.movementAnimator.animateFeatureMovement(
                elementFeature,
                this.geometryHelper.getElementCoordinates(newElement)
            );
        }
        // Redraw the feature to reevaluate its style function
        elementFeature.changed();
    }

    getFeatureFromElement(
        element: ManagedElement
    ): Feature<FeatureType> | undefined {
        return this.layer.getSource()!.getFeatureById(element.id) ?? undefined;
    }

    protected addMarking(
        feature: FeatureLike,
        styles: Style[],
        popupService: PopupService,
        store: any,
        markingStyle: any
    ) {
        const currentPopup = popupService.currentPopupOptions;
        if (
            (currentPopup?.markedForTrainerUUIDs.includes(
                feature.getId() as UUID
            ) &&
                selectStateSnapshot(selectCurrentMainRole, store) ===
                    'trainer') ||
            (currentPopup?.markedForParticipantUUIDs.includes(
                feature.getId() as UUID
            ) &&
                selectStateSnapshot(selectCurrentMainRole, store) ===
                    'participant')
        ) {
            styles.push(markingStyle);
        }
    }

    public onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<FeatureType>,
        condition?: boolean
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}

    /**
     * The standard implementation is to ignore these events.
     */
    public onFeatureDrop(
        droppedElement: StateElement,
        droppedOnFeature: Feature<FeatureType>,
        dropEvent: MouseEvent | TranslateEvent
    ): boolean {
        return false;
    }

    public abstract register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void;

    protected registerFeatureElementManager(
        elementDictionary$: Observable<{ [id: UUID]: ManagedElement }>,
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) {
        this.olMap.addLayer(this.layer);
        mapInteractionsManager.addFeatureLayer(this.layer);
        this.registerChangeHandlers(
            elementDictionary$,
            destroy$,
            (element) => this.onElementCreated(element),
            (element) => this.onElementDeleted(element),
            (oldElement, newElement) =>
                this.onElementChanged(oldElement, newElement)
        );
    }
}
