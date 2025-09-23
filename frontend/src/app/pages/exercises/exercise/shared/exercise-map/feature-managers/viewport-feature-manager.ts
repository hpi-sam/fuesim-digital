import type { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { MapCoordinates, Size, Viewport } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Polygon } from 'ol/geom';
import type OlMap from 'ol/Map';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectCurrentRole,
    selectVisibleViewports,
} from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { ViewportPopupComponent } from '../shared/viewport-popup/viewport-popup.component';
import { calculatePopupPositioning } from '../utility/calculate-popup-positioning';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { MoveableFeatureManager } from './moveable-feature-manager';

export function isInViewport(
    coordinate: Coordinate,
    viewport: Viewport
): boolean {
    return Viewport.isInViewport(viewport, {
        x: coordinate[0]!,
        y: coordinate[1]!,
    });
}

export class ViewportFeatureManager
    extends MoveableFeatureManager<Viewport, Polygon>
    implements FeatureManager<Polygon>
{
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleViewports),
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
            (targetPositions, viewport) => {
                exerciseService.proposeAction(
                    {
                        type: '[Viewport] Move viewport',
                        viewportId: viewport.id,
                        targetPosition: targetPositions[0]![0]!,
                    },
                    true
                );
            },
            new PolygonGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) => [
            this.style,
            this.nameStyleHelper.getStyle(feature as Feature, resolution),
        ]);
    }

    private readonly style = new Style({
        fill: undefined,
        stroke: new Stroke({
            color: '#fafaff',
            width: 2,
        }),
    });

    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const viewport = this.getElementFromFeature(feature) as Viewport;
            const extent = (feature as Feature<Polygon>)
                .getGeometry()!
                .getExtent() as [number, number, number, number];
            return {
                name: viewport.name,
                // The offset is based on the center of the viewports, not the viewports position (which refers to a corner), so we have to divide by 2.
                offsetY: (extent[3] - extent[1]) / 2,
            };
        },
        0.75,
        'top'
    );

    override createFeature(element: Viewport): Feature<Polygon> {
        const feature = super.createFeature(element);
        ResizeRectangleInteraction.onResize(
            feature,
            ({ topLeftCoordinate, scale }) => {
                const currentElement = this.getElementFromFeature(
                    feature
                ) as Viewport;
                this.exerciseService.proposeAction(
                    {
                        type: '[Viewport] Resize viewport',
                        viewportId: element.id,
                        targetPosition: MapCoordinates.create(
                            topLeftCoordinate[0]!,
                            topLeftCoordinate[1]!
                        ),
                        newSize: Size.create(
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
        oldElement: Viewport,
        newElement: Viewport,
        changedProperties: ReadonlySet<keyof Viewport>,
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

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);
        if (selectStateSnapshot(selectCurrentRole, this.store) !== 'trainer') {
            return;
        }
        const zoom = this.olMap.getView().getZoom()!;
        const margin = 10 / zoom;

        this.popupService.openPopup({
            elementUUID: feature.getId()?.toString(),
            component: ViewportPopupComponent,
            closingUUIDs: [feature.getId() as UUID],
            markedForParticipantUUIDs: [],
            markedForTrainerUUIDs: [],
            changedLayers: [],
            context: {
                viewportId: feature.getId() as UUID,
            },
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

    public override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return selectStateSnapshot(selectCurrentRole, this.store) === 'trainer';
    }
}
