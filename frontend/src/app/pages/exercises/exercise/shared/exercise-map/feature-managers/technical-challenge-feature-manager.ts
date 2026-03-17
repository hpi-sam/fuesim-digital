import type { Store } from '@ngrx/store';
import {
    currentStateOf,
    newMapCoordinatesAt,
    newSize,
    type TechnicalChallengeState,
    type TechnicalChallenge,
    type UUID,
    type Element,
} from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type { Polygon } from 'ol/geom';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { TechnicalChallengePopupComponent } from '../shared/technical-challenge-popup/technical-challenge-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import type { PopupService } from '../utility/popup.service';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import {
    selectCurrentMainRole,
    selectVisibleTechnicalChallenges,
} from '../../../../../../state/application/selectors/shared.selectors';
import { ImagePopupHelper } from '../utility/image-popup-helper';
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import type { FeatureManager } from '../utility/feature-manager';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import { calculatePopupPositioning } from '../utility/calculate-popup-positioning';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class TechnicalChallengeFeatureManager
    extends MoveableFeatureManager<TechnicalChallenge, Polygon>
    implements FeatureManager<Polygon>
{
    public override register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleTechnicalChallenges),
            destroy$,
            mapInteractionsManager
        );

        // TODO: listen for state changes
        mapInteractionsManager.addTrainerInteraction(
            new ResizeRectangleInteraction(this.layer.getSource()!)
        );
    }

    private currentStateOfFeature(feature: Feature): TechnicalChallengeState {
        return currentStateOf(
            this.getElementFromFeature(feature) as TechnicalChallenge
        );
    }

    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => this.currentStateOfFeature(feature).image
    );
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    constructor(
        olMap: OlMap,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            async (targetPosition, technicalChallenge) =>
                exerciseService.proposeAction({
                    type: '[TechnicalChallenge] Move technical challenge',
                    technicalChallengeId: technicalChallenge.id,
                    targetPosition: targetPosition[0]![0]!,
                }),
            new PolygonGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) => [
            this.imageStyleHelper.getStyle(feature as Feature, resolution),
            new Style({
                stroke: new Stroke({ color: 'blue' }),
                fill: new Fill({ color: '#ffffff55' }),
            }),
        ]);
    }

    override createFeature(element: TechnicalChallenge): Feature<Polygon> {
        const feature = super.createFeature(element);

        ResizeRectangleInteraction.onResize(
            feature,
            ({ topLeftCoordinate, scale }) => {
                const currentElement = this.getElementFromFeature(
                    feature
                ) as TechnicalChallenge;
                this.exerciseService.proposeAction(
                    {
                        type: '[TechnicalChallenge] Resize technical challenge',
                        technicalChallengeId: element.id,
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

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);

        const zoom = this.olMap.getView().getZoom()!;
        const margin = 10 / zoom;

        this.popupService.togglePopup({
            ...this.popupHelper.getPopupOptions(
                TechnicalChallengePopupComponent,
                feature,
                [feature.getId() as UUID],
                [],
                [],
                [],
                {
                    technicalChallengeId: feature.getId() as UUID,
                }
            ),
            // We want the popup to be centered on the mouse position
            ...calculatePopupPositioning(
                event.coordinate,
                {
                    height: margin,
                    width: margin,
                },
                this.olMap.getView().getCenter()!
            ),
        });
    }

    public override onFeatureDrop(
        droppedElement: StateElement,
        droppedOnFeature: Feature<Polygon>,
        dropEvent: MouseEvent | TranslateEvent
    ): boolean {
        if (droppedElement.type !== 'personnel') {
            return super.onFeatureDrop(
                droppedElement,
                droppedOnFeature,
                dropEvent
            );
        }
        const technicalChallenge = this.getElementFromFeature(
            droppedOnFeature
        ) as TechnicalChallenge;

        // TODO: simply trigger task selection popup

        this.exerciseService.proposeAction(
            {
                type: '[TechnicalChallenge] Assign a personnel to technical challenge',
                technicalChallengeId: technicalChallenge.id,
                personnelId: droppedElement.id,
            },
            true
        );
        return true;
    }

    override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
