import type { Store } from '@ngrx/store';
import type {
    UUID,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
    RestrictedZone,
} from 'digital-fuesim-manv-shared';
import {
    cloneDeepMutable,
    currentCoordinatesOf,
    isOnMap,
    newMapCoordinatesAt,
    newSize,
} from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Polygon } from 'ol/geom';
import type OlMap from 'ol/Map';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectCurrentMainRole,
    selectVisibleRestrictedZone,
} from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import type { TranslateEvent } from 'ol/interaction/Translate';
import { Fill } from 'ol/style';
import { asArray } from 'ol/color';
import { calculatePopupPositioning } from '../utility/calculate-popup-positioning';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { RestrictedZonePopupComponent } from '../shared/restricted-zone-popup/restricted-zone-popup.component';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class RestrictedZoneFeatureManager
    extends MoveableFeatureManager<RestrictedZone, Polygon>
    implements FeatureManager<Polygon>
{
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleRestrictedZone),
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
            (targetPositions, restrictedZone) => {
                exerciseService.proposeAction({
                    type: '[RestrictedZone] Move restricted zone',
                    restrictedZoneId: restrictedZone.id,
                    targetPosition: targetPositions[0]![0]!,
                });
            },
            new PolygonGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) => [
            this.getStyleForFeature(feature as Feature<Polygon>),
            this.nameStyleHelper.getStyle(feature as Feature, resolution),
        ]);
    }

    private getStyleForFeature(feature: Feature<Polygon>): Style {
        const restrictedZone = this.getElementFromFeature(
            feature
        ) as RestrictedZone;

        // OpenLayers caches the results, so we must not modify them directly
        // → Array destructuring to create a copy
        const fill = [...asArray(restrictedZone.color)];
        fill[3] = 0.2;

        return new Style({
            fill: new Fill({ color: fill }),
            stroke: new Stroke({
                color: restrictedZone.color,
                width: 2,
            }),
        });
    }

    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const restrictedZone = this.getElementFromFeature(
                feature
            ) as RestrictedZone;
            const extent = (feature as Feature<Polygon>)
                .getGeometry()!
                .getExtent() as [number, number, number, number];
            return {
                name: `${restrictedZone.name} (${restrictedZone.vehicleIds.length}/${restrictedZone.capacity})`,
                offsetY: (extent[3] - extent[1]) / 2,
            };
        },
        0.75,
        'top'
    );

    override createFeature(element: RestrictedZone): Feature<Polygon> {
        const feature = super.createFeature(element);
        ResizeRectangleInteraction.onResize(
            feature,
            ({ topLeftCoordinate, scale }) => {
                const currentElement = this.getElementFromFeature(
                    feature
                ) as RestrictedZone;
                this.exerciseService.proposeAction(
                    {
                        type: '[RestrictedZone] Resize restricted zone',
                        restrictedZoneId: element.id,
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
        oldElement: RestrictedZone,
        newElement: RestrictedZone,
        changedProperties: ReadonlySet<keyof RestrictedZone>,
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
        elementFeature.changed();
    }

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
        const zoom = this.olMap.getView().getZoom()!;
        const margin = 10 / zoom;

        this.popupService.openPopup({
            elementUUID: feature.getId()?.toString(),
            component: RestrictedZonePopupComponent,
            closingUUIDs: [feature.getId() as UUID],
            markedForParticipantUUIDs: [],
            markedForTrainerUUIDs: [],
            changedLayers: [],
            context: {
                restrictedZoneId: feature.getId() as UUID,
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

    public override onFeatureDrop(
        droppedElement: Element | undefined,
        droppedOnFeature: Feature<any>,
        dropEvent?: TranslateEvent
    ) {
        const droppedOnRestrictedZone = this.getElementFromFeature(
            droppedOnFeature
        ) as RestrictedZone | undefined;
        if (!droppedElement || !droppedOnRestrictedZone) {
            console.error('Could not find element for the features');
            return false;
        }
        if (droppedElement.type === 'vehicle' && isOnMap(droppedElement)) {
            if (
                droppedElement.restrictedZoneId === droppedOnRestrictedZone.id
            ) {
                // The vehicle is already assigned to the restricted zone
                return true;
            }
            if (
                droppedOnRestrictedZone.vehicleRestrictions[
                    droppedElement.vehicleType
                ] === 'ignore'
            ) {
                return true;
            }
            if (
                droppedOnRestrictedZone.vehicleRestrictions[
                    droppedElement.vehicleType
                ] === 'restrict'
            ) {
                if (
                    droppedOnRestrictedZone.vehicleIds.length <
                    droppedOnRestrictedZone.capacity
                ) {
                    this.exerciseService.proposeAction({
                        type: '[Vehicle] Assign restricted zone to vehicle',
                        vehicleId: droppedElement.id,
                        restrictedZoneId: droppedOnRestrictedZone.id,
                    });
                    return true;
                }
            }
            const coordinates = cloneDeepMutable(
                currentCoordinatesOf(droppedOnRestrictedZone)
            );

            // place the vehicle on the right hand side of the restricted zone
            coordinates.y -= 0.5 * droppedOnRestrictedZone.size.height;
            coordinates.x +=
                10 + Math.max(droppedOnRestrictedZone.size.width, 0);

            this.exerciseService.proposeAction({
                type: '[Vehicle] Move vehicle',
                vehicleId: droppedElement.id,
                targetPosition: coordinates,
            });
            return false;
        }
        return false;
    }

    public override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
