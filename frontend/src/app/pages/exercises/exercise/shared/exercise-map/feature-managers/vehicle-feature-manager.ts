import { createSelector, type Store } from '@ngrx/store';
import { normalZoom } from 'fuesim-digital-shared';
import type {
    UUID,
    Vehicle,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
    PatientStatus,
} from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type OlMap from 'ol/Map';
import { pairwise, startWith, takeUntil, type Subject } from 'rxjs';
import { Fill, Stroke, Style, Text as OlText } from 'ol/style';
import { VehiclePopupComponent } from '../shared/vehicle-popup/vehicle-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/image-popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { CircleStyleHelper } from '../utility/style-helper/circle-style-helper';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectConfiguration,
    selectVehicles,
    selectExerciseState,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { MoveableFeatureManager } from './moveable-feature-manager';
import { Immutable } from 'immer';

type PossibleVehicleStatus = Exclude<PatientStatus, 'white'>;

interface StatusbarColor {
    backgroundColor: string;
    backgroundStroke: string;
    color: string;
}

const statusPriorities = [
    'red',
    'yellow',
    'green',
    'blue',
    'black',
] as const satisfies PossibleVehicleStatus[];

const patientStatusToStatusbarColors = {
    red: {
        backgroundColor: 'rgba(220, 53, 69, 0.85)',
        backgroundStroke: 'rgb(220, 53, 69)',
        color: 'white',
    },
    yellow: {
        backgroundColor: 'rgba(255, 193, 7, 0.85)',
        backgroundStroke: 'rgb(255, 193, 7)',
        color: 'black',
    },
    green: {
        backgroundColor: 'rgba(40, 167, 69, 0.85)',
        backgroundStroke: 'rgb(40, 167, 69)',
        color: 'white',
    },
    black: {
        backgroundColor: 'rgba(15, 15, 15, 0.85)',
        backgroundStroke: 'rgb(15, 15, 15)',
        color: 'white',
    },
    blue: {
        backgroundColor: 'rgba(0, 123, 255, 0.85)',
        backgroundStroke: 'rgb(0, 123, 255)',
        color: 'white',
    },
} as const satisfies {
    [key in PossibleVehicleStatus]: StatusbarColor;
};

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

        // Register change handlers to show/hide vehicle status indicators if configuration was changed
        this.store
            .select(
                createSelector(
                    selectConfiguration,
                    selectVehicles,
                    (configuration, vehicles) => ({
                        vehicleStatusHighlight:
                            configuration.vehicleStatusHighlight,
                        vehicleStatusInPatientStatusColor:
                            configuration.vehicleStatusInPatientStatusColor,
                        vehicles,
                    })
                )
            )
            .pipe(
                startWith({
                    vehicleStatusHighlight: false,
                    vehicleStatusInPatientStatusColor: false,
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    vehicles: {} as { [key: UUID]: Vehicle },
                }),
                pairwise(),
                takeUntil(destroy$)
            )
            .subscribe(([oldData, newData]) => {
                if (
                    oldData.vehicleStatusHighlight !==
                        newData.vehicleStatusHighlight ||
                    oldData.vehicleStatusInPatientStatusColor !==
                        newData.vehicleStatusInPatientStatusColor
                ) {
                    Object.values(newData.vehicles).forEach((newVehicle) => {
                        const oldVehicle = oldData.vehicles[newVehicle.id];
                        if (oldVehicle)
                            this.onElementChanged(oldVehicle, newVehicle);
                    });
                }
            });
    }
    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => (this.getElementFromFeature(feature) as Vehicle).image
    );
    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const vehicle = this.getElementFromFeature(feature) as Vehicle;
            return {
                name: vehicle.versionId ?? vehicle.name,
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
            async (targetPosition, vehicle) =>
                exerciseService.proposeAction(
                    {
                        type: '[Vehicle] Move vehicle',
                        vehicleId: vehicle.id,
                        targetPosition,
                    },
                    true
                ),
            new PointGeometryHelper(),
            1000
        );
        this.layer.setStyle((feature, resolution) => {
            const styles = [
                this.nameStyleHelper.getStyle(feature as Feature, resolution),
                this.imageStyleHelper.getStyle(feature as Feature, resolution),
            ];

            const statusBarStyle = this.statusBarStyleHelper(
                feature as Feature
            );
            if (statusBarStyle) {
                styles.push(...statusBarStyle);
            }

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
        droppedElement: Immutable<Element> | undefined,
        droppedOnFeature: Feature<Point>,
        dropEvent: MouseEvent | TranslateEvent
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

        this.popupService.togglePopup(
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

    /**
     * Creates statusbar styles for a vehicle feature.
     * The statusbar shows the number of occupied/all patient seats and is, optionally, colored by the patient's status color.
     */
    private readonly statusBarStyleHelper = (
        feature: Feature<any>
    ): Style[] | undefined => {
        const config = selectStateSnapshot(selectConfiguration, this.store);
        if (!config.vehicleStatusHighlight) {
            return undefined;
        }

        const vehicle = this.getElementFromFeature(feature) as Vehicle;
        if (vehicle.patientCapacity <= 0) {
            return undefined;
        }

        const patientCount = Object.keys(vehicle.patientIds).length;
        const text = `${patientCount}/${vehicle.patientCapacity}`;

        let statusbarColor: StatusbarColor = {
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backgroundStroke: 'rgb(255, 255, 255)',
            color: 'black',
        };

        if (config.vehicleStatusInPatientStatusColor && patientCount > 0) {
            const state = selectStateSnapshot(selectExerciseState, this.store);
            const patients = Object.keys(vehicle.patientIds)
                .map((id) => state.patients[id])
                .filter(Boolean);

            const getStatus = (p: any) =>
                config.pretriageEnabled ? p.pretriageStatus : p.realStatus;

            const vehicleStatusColor = statusPriorities.find((s) =>
                patients.some((p) => p && getStatus(p) === s)
            );
            if (vehicleStatusColor)
                statusbarColor =
                    patientStatusToStatusbarColors[vehicleStatusColor];
        }

        const resolution = this.olMap.getView().getResolution() ?? 1;
        const scale = 1 / resolution;
        const fontPx = 2 * scale;

        const textStyle = new Style({
            text: new OlText({
                text,
                font: `${fontPx}px sans-serif`,
                fill: new Fill({ color: statusbarColor.color }),
                backgroundFill: new Fill({
                    color: statusbarColor.backgroundColor,
                }),
                backgroundStroke: new Stroke({
                    color: statusbarColor.backgroundStroke,
                    width: 0.5 * scale,
                }),
                offsetY: -5 * scale,
                padding: [0.3 * scale, 2 * scale, 0 * scale, 2 * scale],
                textAlign: 'center',
                textBaseline: 'middle',
            }),
        });

        return [textStyle];
    };
}
