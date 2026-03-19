import { createSelector, type Store } from '@ngrx/store';
import type { UUID, RestrictedZone } from 'fuesim-digital-shared';
import {
    countRestrictedVehiclesInRestrictedZone,
    currentCoordinatesOf,
    isInRestrictedZone,
    isOnMap,
    newMapCoordinatesAt,
    newSize,
} from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type { Polygon } from 'ol/geom';
import type OlMap from 'ol/Map';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import { pairwise, startWith, takeUntil, type Subject } from 'rxjs';
import { asArray } from 'ol/color';
import { Fill } from 'ol/style';
import { isEmpty } from 'lodash-es';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PolygonGeometryHelper } from '../utility/polygon-geometry-helper';
import { ResizeRectangleInteraction } from '../utility/resize-rectangle-interaction';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { RestrictedZonePopupComponent } from '../shared/restricted-zone-popup/restricted-zone-popup.component';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectRestrictedZones,
    selectVehicles,
    selectExerciseState,
} from '../../../../../../state/application/selectors/exercise.selectors';
import {
    selectVisibleRestrictedZones,
    selectCurrentMainRole,
} from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { PointRelativePopupHelper } from '../utility/point-relative-popup-helper';
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
            this.store.select(selectVisibleRestrictedZones),
            destroy$,
            mapInteractionsManager
        );

        // Register change handlers to update number of vehicles if a vehicle has been moved
        this.store
            .select(
                createSelector(
                    selectRestrictedZones,
                    selectVehicles,
                    (restrictedZones, vehicles) =>
                        Object.fromEntries(
                            Object.values(restrictedZones).map((rz) => [
                                rz.id,
                                {
                                    restrictedZone: rz,
                                    vehicleCount: Object.values(
                                        vehicles
                                    ).filter(
                                        (v) =>
                                            isOnMap(v) &&
                                            isInRestrictedZone(
                                                rz,
                                                currentCoordinatesOf(v)
                                            )
                                    ),
                                },
                            ])
                        )
                )
            )
            .pipe(
                startWith(
                    {} as {
                        [key: string]: {
                            restrictedZone: RestrictedZone;
                            vehicleCount: number;
                        };
                    }
                ),
                pairwise(),
                takeUntil(destroy$)
            )
            .subscribe(([oldZones, newZones]) =>
                Object.entries(newZones).forEach(([zoneId, vehicleCount]) => {
                    if (
                        !isEmpty(oldZones) &&
                        (!(zoneId in oldZones) ||
                            oldZones[zoneId]!.vehicleCount !== vehicleCount)
                    )
                        this.onElementChanged(
                            oldZones[zoneId]!.restrictedZone,
                            newZones[zoneId]!.restrictedZone
                        );
                })
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
            async (targetPositions, restrictedZone) =>
                exerciseService.proposeAction({
                    type: '[RestrictedZone] Move restricted zone',
                    restrictedZoneId: restrictedZone.id,
                    targetPosition: targetPositions[0]![0]!,
                }),
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
            const vehicleCount = countRestrictedVehiclesInRestrictedZone(
                selectStateSnapshot(selectExerciseState, this.store),
                restrictedZone
            );

            if (
                selectStateSnapshot(selectCurrentMainRole, this.store) ===
                'trainer'
            )
                return {
                    name: `${restrictedZone.name} (${vehicleCount}/${restrictedZone.capacity})`,
                    offsetY: (extent[3] - extent[1]) / 2,
                };

            const nameSegments = [];
            if (restrictedZone.nameVisible)
                nameSegments.push(restrictedZone.name);
            if (restrictedZone.capacityVisible)
                nameSegments.push(
                    `(${vehicleCount}/${restrictedZone.capacity})`
                );
            return {
                name: nameSegments.join(' '),
                offsetY: (extent[3] - extent[1]) / 2,
            };
        },
        0.75,
        'top'
    );

    private readonly popupHelper = new PointRelativePopupHelper(this.olMap);

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

        const restrictedZoneId = feature.getId() as UUID;
        this.popupService.openPopup(this.popupHelper.getPopupOptions(RestrictedZonePopupComponent,event.coordinate,[restrictedZoneId],[],[],[],{restrictedZoneId}))
    }

    public override isFeatureTranslatable(feature: Feature<Polygon>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
