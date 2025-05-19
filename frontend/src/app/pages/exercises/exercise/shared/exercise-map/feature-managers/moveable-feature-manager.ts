import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import type VectorSource from 'ol/source/Vector';
import type { Observable, Subject } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element, UUID } from 'digital-fuesim-manv-shared';
import type { FeatureLike } from 'ol/Feature';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { selectCurrentRole } from 'src/app/state/application/selectors/shared.selectors';
import type Style from 'ol/style/Style';
import type RenderFeature from 'ol/render/Feature';
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
    protected movementAnimator: MovementAnimator<FeatureType>;
    public layer: VectorLayer<VectorSource<Feature<FeatureType>>>;
    constructor(
        protected readonly olMap: OlMap,
        private readonly proposeMovementAction: (
            newPosition: Positions<FeatureType>,
            element: ManagedElement
        ) => void,
        protected readonly geometryHelper: GeometryHelper<
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

    createFeature(element: ManagedElement): Feature<FeatureType> {
        const elementFeature = this.geometryHelper.create(element);
        elementFeature.setId(element.id);
        this.layer.getSource()!.addFeature(elementFeature);
        TranslateInteraction.onTranslateEnd<FeatureType>(
            elementFeature,
            (newPosition) => {
                this.proposeMovementAction(newPosition, element);
            },
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
        const feature = this.layer.getSource()!.getFeatureById(element.id);
        return (
            (feature as Exclude<typeof feature, RenderFeature[]>) ?? undefined
        );
    }

    protected addMarking(
        feature: FeatureLike,
        styles: Style[],
        popupService: any,
        store: any,
        markingStyle: any
    ) {
        if (
            (popupService.currentPopup?.markedForTrainerUUIDs.includes(
                feature.getId() as UUID
            ) &&
                selectStateSnapshot(selectCurrentRole, store) === 'trainer') ||
            (popupService.currentPopup?.markedForParticipantUUIDs.includes(
                feature.getId() as UUID
            ) &&
                selectStateSnapshot(selectCurrentRole, store) === 'participant')
        ) {
            styles.push(markingStyle);
        }
    }

    public onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<FeatureType>
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}

    /**
     * The standard implementation is to ignore these events.
     */
    public onFeatureDrop(
        droppedElement: Element,
        droppedOnFeature: Feature<FeatureType>,
        dropEvent?: TranslateEvent
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
