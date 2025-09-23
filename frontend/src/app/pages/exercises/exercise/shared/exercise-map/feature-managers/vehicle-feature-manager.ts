import type { Store } from '@ngrx/store';
import { normalZoom } from 'digital-fuesim-manv-shared';
import type {
    UUID,
    Vehicle,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
} from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { selectVisibleVehicles } from 'src/app/state/application/selectors/shared.selectors';
import { Fill, Stroke } from 'ol/style';
import { VehiclePopupComponent } from '../shared/vehicle-popup/vehicle-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { CircleStyleHelper } from '../utility/style-helper/circle-style-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class VehicleFeatureManager extends MoveableFeatureManager<Vehicle> {
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleVehicles),
            destroy$,
            mapInteractionsManager
        );
    }
    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => (this.getElementFromFeature(feature) as Vehicle).image
    );
    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const vehicle = this.getElementFromFeature(feature) as Vehicle;
            return {
                name: vehicle.name,
                offsetY: vehicle.image.height / 2 / normalZoom,
            };
        },
        0.1,
        'top'
    );
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    private readonly openPopupCircleStyleHelper = new CircleStyleHelper(
        (feature) => ({
            radius: Math.max(
                (this.getElementFromFeature(feature) as Vehicle).image.height,
                (this.getElementFromFeature(feature) as Vehicle).image.height *
                    (this.getElementFromFeature(feature) as Vehicle).image
                        .aspectRatio
            ),
            fill: new Fill({
                color: '#00000000',
            }),
            stroke: new Stroke({
                color: 'orange',
                width: 10,
            }),
        }),
        0.025,
        (_) => [0, 0]
    );

    constructor(
        olMap: OlMap,
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            (targetPosition, vehicle) => {
                exerciseService.proposeAction(
                    {
                        type: '[Vehicle] Move vehicle',
                        vehicleId: vehicle.id,
                        targetPosition,
                    },
                    true
                );
            },
            new PointGeometryHelper(),
            1000
        );
        this.layer.setStyle((feature, resolution) => {
            const styles = [
                this.nameStyleHelper.getStyle(feature as Feature, resolution),
                this.imageStyleHelper.getStyle(feature as Feature, resolution),
            ];
            this.addMarking(
                feature,
                styles,
                this.popupService,
                this.store,
                this.openPopupCircleStyleHelper.getStyle(
                    feature as Feature,
                    resolution
                )
            );
            return styles;
        });
    }

    public override onFeatureDrop(
        droppedElement: Element | undefined,
        droppedOnFeature: Feature<Point>,
        dropEvent?: TranslateEvent
    ) {
        const droppedOnVehicle = this.getElementFromFeature(
            droppedOnFeature
        ) as Vehicle | undefined;
        if (!droppedElement || !droppedOnVehicle) {
            console.error('Could not find element for the features');
            return false;
        }
        if (
            (droppedElement.type === 'personnel' &&
                droppedOnVehicle.personnelIds[droppedElement.id]) ||
            (droppedElement.type === 'material' &&
                droppedOnVehicle.materialIds[droppedElement.id]) ||
            (droppedElement.type === 'patient' &&
                Object.keys(droppedOnVehicle.patientIds).length <
                    droppedOnVehicle.patientCapacity)
        ) {
            // TODO: user feedback (e.g. toast)
            this.exerciseService.proposeAction(
                {
                    type: '[Vehicle] Load vehicle',
                    vehicleId: droppedOnVehicle.id,
                    elementToBeLoadedId: droppedElement.id,
                    elementToBeLoadedType: droppedElement.type,
                },
                true
            );
            return true;
        }
        return false;
    }

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);

        const vehicle = this.getElementFromFeature(feature) as Vehicle;

        this.popupService.openPopup(
            this.popupHelper.getPopupOptions(
                VehiclePopupComponent,
                feature,
                [feature.getId() as UUID],
                [
                    ...Object.keys(vehicle.materialIds),
                    ...Object.keys(vehicle.personnelIds),
                    feature.getId() as UUID,
                ],
                [feature.getId() as UUID],
                ['vehicle', 'personnel', 'material'],
                {
                    vehicleId: feature.getId() as UUID,
                }
            )
        );
    }
}
