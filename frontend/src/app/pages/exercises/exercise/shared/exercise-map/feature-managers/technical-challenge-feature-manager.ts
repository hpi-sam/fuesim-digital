import type { Store } from '@ngrx/store';
import {
    currentStateOf,
    newMapCoordinatesAt,
    newSize,
} from 'fuesim-digital-shared';
import type {
    TechnicalChallengeState,
    TechnicalChallenge,
    UUID,
    Element as StateElement,
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
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import type { FeatureManager } from '../utility/feature-manager';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import {
    selectCurrentMainRole,
    selectVisibleTechnicalChallenges,
} from '../../../../../../state/application/selectors/shared.selectors';
import { ChooseTaskPopupComponent } from '../shared/choose-task-popup/choose-task-popup.component';
import { PointRelativePopupHelper } from '../utility/point-relative-popup-helper';
import type { OlMapManager } from '../utility/ol-map-manager';
import { MoveableFeatureManager } from './moveable-feature-manager';
import type { PersonnelFeatureManager } from './personnel-feature-manager';

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
    private readonly popupHelper = new PointRelativePopupHelper(this.olMap);

    constructor(
        olMap: OlMap,
        private readonly olMapManager: OlMapManager,
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

        const technicalChallengeId = feature.getId() as UUID;

        this.popupService.togglePopup(
            this.popupHelper.getPopupOptions(
                TechnicalChallengePopupComponent,
                event.coordinate,
                [technicalChallengeId],
                [],
                [],
                [],
                {
                    technicalChallengeId,
                }
            )
        );
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
        // personnel can't be dragged from the editor -> always a TranslateEvent
        const translateEvent = dropEvent as TranslateEvent;
        const technicalChallenge = this.getElementFromFeature(
            droppedOnFeature
        ) as TechnicalChallenge;
        const personnelManager =
            this.olMapManager.featureNameFeatureManagerDictionary.get(
                'personnel'
            ) as PersonnelFeatureManager;
        const personnelFeature =
            personnelManager.getFeatureFromElement(droppedElement)!;

        const revertPersonnelMoveCallback = () => {
            personnelManager.movementAnimator.animateFeatureMovement(
                personnelFeature,
                translateEvent.startCoordinate
            );
        };
        const assignTaskCallback = async (taskId: UUID) => {
            const response = await this.exerciseService.proposeAction(
                {
                    type: '[TechnicalChallenge] Assign a personnel to technical challenge',
                    technicalChallengeId: technicalChallenge.id,
                    personnelId: droppedElement.id,
                    taskId,
                    targetPosition:
                        personnelManager.geometryHelper.getFeaturePosition(
                            personnelFeature
                        ),
                },
                true
            );

            if (!response.success) {
                revertPersonnelMoveCallback();
            }
        };

        this.popupService.togglePopup({
            onDismissCallback: revertPersonnelMoveCallback,
            ...this.popupHelper.getPopupOptions(
                ChooseTaskPopupComponent,
                translateEvent.coordinate,
                [],
                [],
                [],
                [],
                {
                    technicalChallengeId: technicalChallenge.id,
                    personnelId: droppedElement.id,
                    assignTaskCallback,
                }
            ),
        });

        return true;
    }

    override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
