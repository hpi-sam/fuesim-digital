import type { Store } from '@ngrx/store';
import type {
    UUID,
    SimulatedRegion,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
} from 'fuesim-digital-shared';
import { newMapCoordinatesAt, newSize } from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Polygon } from 'ol/geom';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type OlMap from 'ol/Map';
import { Fill } from 'ol/style';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type { Subject } from 'rxjs';
import { SimulatedRegionPopupComponent } from '../shared/simulated-region-popup/simulated-region-popup.component';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectVisibleSimulatedRegions,
    selectCurrentMainRole,
} from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { PointRelativePopupHelper } from '../utility/point-relative-popup-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class SimulatedRegionFeatureManager
    extends MoveableFeatureManager<SimulatedRegion, Polygon>
    implements FeatureManager<Polygon>
{
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleSimulatedRegions),
            destroy$,
            mapInteractionsManager
        );
        mapInteractionsManager.addTrainerInteraction(
            new ResizeRectangleInteraction(this.layer.getSource()!)
        );
    }
    constructor(
        olMap: OlMap,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            async (targetPositions, simulatedRegion) =>
                exerciseService.proposeAction(
                    {
                        type: '[SimulatedRegion] Move simulated region',
                        simulatedRegionId: simulatedRegion.id,
                        targetPosition: targetPositions[0]![0]!,
                    },
                    true
                ),
            new PolygonGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) => [
            new Style({
                fill: this.fill,
                stroke: new Stroke({
                    color: (
                        this.getElementFromFeature(
                            feature as Feature
                        ) as SimulatedRegion
                    ).borderColor,
                    width: this.strokeWidth,
                }),
            }),
            this.nameStyleHelper.getStyle(feature as Feature, resolution),
        ]);
    }

    private readonly fill = new Fill({ color: '#808080cc' });
    private readonly strokeWidth = 2;

    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const region = this.getElementFromFeature(
                feature
            ) as SimulatedRegion;
            return {
                name: region.name,
                // The offset ist based on the center of the position, not the regions position (which refers to a corner)
                offsetY: 0,
            };
        },
        0.75,
        'middle'
    );

    override createFeature(element: SimulatedRegion): Feature<Polygon> {
        const feature = super.createFeature(element);
        ResizeRectangleInteraction.onResize(
            feature,
            ({ topLeftCoordinate, scale }) => {
                const currentElement = this.getElementFromFeature(
                    feature
                ) as SimulatedRegion;
                this.exerciseService.proposeAction(
                    {
                        type: '[SimulatedRegion] Resize simulated region',
                        simulatedRegionId: element.id,
                        targetPosition: newMapCoordinatesAt(
                            topLeftCoordinate[0]!,
                            topLeftCoordinate[1]!
                        ),
                        newSize: newSize(
                            currentElement.size.width * scale.x,
                            currentElement.size.height * scale.y
                        ),
                    },
                    true
                );
            }
        );
        return feature;
    }

    override changeFeature(
        oldElement: SimulatedRegion,
        newElement: SimulatedRegion,
        changedProperties: ReadonlySet<keyof SimulatedRegion>,
        elementFeature: Feature<Polygon>
    ): void {
        if (
            changedProperties.has('position') ||
            changedProperties.has('size')
        ) {
            this.movementAnimator.animateFeatureMovement(
                elementFeature,
                this.geometryHelper.getElementCoordinates(newElement)
            );
        }
        // If the style has updated, we need to redraw the feature
        elementFeature.changed();
    }

    public override onFeatureDrop(
        droppedElement: Element | undefined,
        droppedOnFeature: Feature<any>,
        dropEvent?: TranslateEvent
    ) {
        const droppedOnSimulatedRegion = this.getElementFromFeature(
            droppedOnFeature
        ) as SimulatedRegion | undefined;
        if (!droppedElement || !droppedOnSimulatedRegion) {
            console.error('Could not find element for the features');
            return false;
        }
        if (
            ['vehicle', 'personnel', 'material', 'patient'].includes(
                droppedElement.type
            )
        ) {
            this.exerciseService.proposeAction(
                {
                    type: '[SimulatedRegion] Add Element',
                    simulatedRegionId: droppedOnSimulatedRegion.id,
                    elementToBeAddedType: droppedElement.type as
                        | 'material'
                        | 'patient'
                        | 'personnel'
                        | 'vehicle',
                    elementToBeAddedId: droppedElement.id,
                },
                true
            );
            return true;
        }
        return false;
    }

    private readonly popupHelper = new PointRelativePopupHelper(this.olMap);

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);
        if (
            selectStateSnapshot(selectCurrentMainRole, this.store) !== 'trainer'
        ) {
            return;
        }

        const simulatedRegionId = feature.getId() as UUID;
        this.popupService.openPopup(
            this.popupHelper.getPopupOptions(
                SimulatedRegionPopupComponent,
                event.coordinate,
                [simulatedRegionId],
                [],
                [],
                [],
                { simulatedRegionId }
            )
        );
    }

    public override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
