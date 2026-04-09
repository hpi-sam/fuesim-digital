import type { Store } from '@ngrx/store';
import type { Viewport } from 'fuesim-digital-shared';
import {
    upperLeftCornerOf,
    lowerRightCornerOf,
    isInViewport,
    getBoundingBox,
} from 'fuesim-digital-shared';
import { Collection, View } from 'ol';
import type { Interaction } from 'ol/interaction';
import type VectorLayer from 'ol/layer/Vector';
import OlMap from 'ol/Map';
import { Subject, takeUntil } from 'rxjs';
import { fromLonLat, toLonLat } from 'ol/proj';
import { z } from 'zod';
import type { Coordinate } from 'ol/coordinate';
import type { TransferLinesService } from '../../core/transfer-lines.service';
import { startingPosition } from '../../starting-position';
import { CateringLinesFeatureManager } from '../feature-managers/catering-lines-feature-manager';
import { DeleteFeatureManager } from '../feature-managers/delete-feature-manager';
import { MapImageFeatureManager } from '../feature-managers/map-images-feature-manager';
import { MaterialFeatureManager } from '../feature-managers/material-feature-manager';
import { PatientFeatureManager } from '../feature-managers/patient-feature-manager';
import { PersonnelFeatureManager } from '../feature-managers/personnel-feature-manager';
import { SimulatedRegionFeatureManager } from '../feature-managers/simulated-region-feature-manager';
import { TransferLinesFeatureManager } from '../feature-managers/transfer-lines-feature-manager';
import { TransferPointFeatureManager } from '../feature-managers/transfer-point-feature-manager';
import { VehicleFeatureManager } from '../feature-managers/vehicle-feature-manager';
import { TechnicalChallengeFeatureManager } from '../feature-managers/technical-challenge-feature-manager';
import { ViewportFeatureManager } from '../feature-managers/viewport-feature-manager';
import { RestrictedZoneFeatureManager } from '../feature-managers/restricted-zone-feature-manager';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectViewports,
    selectSimulatedRegions,
} from '../../../../../../state/application/selectors/exercise.selectors';
import {
    selectRestrictedViewport,
    selectCurrentMainRole,
} from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { FeatureManager } from './feature-manager';
import type { PopupManager } from './popup-manager';
import { OlMapInteractionsManager } from './ol-map-interactions-manager';
import { SatelliteLayerManager } from './satellite-layer-manager';
import type { PopupService } from './popup.service';

export const coordinateStringSchema = z
    .string()
    .regex(/^-?\d{1,3}(.\d+)?$/u, 'Die Eingabe ist keine gültige Koordinate.');
const coordinateStringToNumber = z.codec(coordinateStringSchema, z.number(), {
    decode: (str) => Number.parseFloat(str),
    encode: (num) => num.toFixed(6),
});

export const olMapCoordinatesSchema = z.object({
    longitude: coordinateStringToNumber,
    latitude: coordinateStringToNumber,
    zoom: coordinateStringToNumber.optional(),
});
export type OlMapCoordinates = z.infer<typeof olMapCoordinatesSchema>;
export type OlMapCoordinatesInput = z.input<typeof olMapCoordinatesSchema>;

export class OlMapManager {
    private readonly _olMap: OlMap;
    private featureManagers: FeatureManager<any>[];
    private readonly mapInteractionsManager: OlMapInteractionsManager;
    private static readonly defaultZoom = 20;
    private readonly destroy$ = new Subject<void>();

    /**
     * key: the layer that is passed to the featureManager, that is saved in the value
     * ```ts
     * layerFeatureManagerDictionary.get(layer) === featureManager
     * // means that:
     * featureManager.layer === layer
     * ```
     */
    public readonly layerFeatureManagerDictionary = new Map<
        VectorLayer,
        FeatureManager<any>
    >();

    public readonly featureNameFeatureManagerDictionary = new Map<
        string,
        FeatureManager<any>
    >();

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly openLayersContainer: HTMLDivElement,
        private readonly transferLinesService: TransferLinesService,
        private readonly popupManager: PopupManager,
        private readonly popupService: PopupService
    ) {
        this._olMap = new OlMap({
            interactions: new Collection<Interaction>(),
            // We use Angular buttons instead
            controls: [],
            target: this.openLayersContainer,
            // Note: The order of this array determines the order of the objects on the map.
            // The most bottom objects must be at the top of the array.
            layers: [],
            overlays: [this.popupManager.popupOverlay],
            view: new View({
                center: [startingPosition.x, startingPosition.y],
                zoom: OlMapManager.defaultZoom,
                maxZoom: 23,
                smoothExtentConstraint: false,
                smoothResolutionConstraint: false,
                constrainRotation: 1,
            }),
        });

        this.featureManagers = [];
        this.initializeFeatureManagers();

        this.mapInteractionsManager = new OlMapInteractionsManager(
            this.olMap.getInteractions(),
            store,
            popupManager,
            popupService,
            this.olMap,
            this.layerFeatureManagerDictionary,
            this.destroy$
        );

        const satelliteLayerManager = new SatelliteLayerManager(
            store,
            this.destroy$
        );

        this.olMap.getLayers().clear();
        this.olMap.addLayer(satelliteLayerManager.satelliteLayer);

        // the mapInteractionsManager needs to be set and the satelliteLayer needs to be added before this is possible
        this.registerFeatureManagers();

        this.registerViewportRestriction();

        popupManager.registerPopupTriggers(
            this.olMap,
            openLayersContainer,
            this.layerFeatureManagerDictionary,
            this.featureNameFeatureManagerDictionary
        );
    }

    public get olMap(): OlMap {
        return this._olMap;
    }

    private isInViewport(coordinate: Coordinate, viewport: Viewport): boolean {
        return isInViewport(viewport, {
            x: coordinate[0]!,
            y: coordinate[1]!,
        });
    }

    private registerViewportRestriction() {
        this.tryToFitViewForOverview(false);
        this.store
            .select(selectRestrictedViewport)
            .pipe(takeUntil(this.destroy$))
            .subscribe((viewport) => {
                const view = this.olMap.getView();
                view.set('extent', undefined);
                view.setMinZoom(0);
                if (!viewport) {
                    // We are no longer restricted to a viewport.
                    // Therefore, no new restrictions have to be set.
                    return;
                }
                const center = view.getCenter()!;
                const previousZoom = view.getZoom()!;
                const targetUpperLeftCorner = upperLeftCornerOf(viewport);
                const targetLowerRightCorner = lowerRightCornerOf(viewport);
                const targetExtent = [
                    targetUpperLeftCorner.x,
                    targetLowerRightCorner.y,
                    targetLowerRightCorner.x,
                    targetUpperLeftCorner.y,
                ];
                view.fit(targetExtent);
                const matchingZoom = view.getZoom()!;
                if (this.isInViewport(center, viewport)) {
                    // We only want to change the zoom if necessary
                    view.setZoom(previousZoom);
                    view.setCenter(center);
                }

                view.set('extent', targetExtent);
                const minZoom = Math.min(matchingZoom, view.getMaxZoom());
                view.setMinZoom(minZoom);
            });
    }

    /**
     * Sets the map's view to see all viewports and simulated regions.
     */
    public tryToFitViewForOverview(animate = true) {
        if (
            selectStateSnapshot(selectRestrictedViewport, this.store) !==
            undefined
        ) {
            // We are restricted to a viewport -> you can't fit the view
            return;
        }
        const elements = [
            ...Object.values(selectStateSnapshot(selectViewports, this.store)),
            ...Object.values(
                selectStateSnapshot(selectSimulatedRegions, this.store)
            ),
        ];
        const view = this.olMap.getView();
        if (elements.length === 0) {
            view.setCenter([startingPosition.x, startingPosition.y]);
            return;
        }
        const boundingBox = getBoundingBox(elements);
        const padding = 25;
        view.fit(
            [
                boundingBox.minX,
                boundingBox.minY,
                boundingBox.maxX,
                boundingBox.maxY,
            ],
            {
                padding: [padding, padding, padding, padding],
                duration: animate ? 1000 : undefined,
            }
        );
    }

    public getCoordinates() {
        return this.olMap.getView().getCenter();
    }

    public getLonLat() {
        const center = this.getCoordinates();
        if (!center) return;
        return toLonLat(center);
    }

    public tryGoToCoordinates(coordinates: OlMapCoordinates) {
        if (
            selectStateSnapshot(selectCurrentMainRole, this.store) ===
                'participant' &&
            selectStateSnapshot(selectRestrictedViewport, this.store) !==
                undefined
        ) {
            // Participants or people restricted to viewports may not go to arbitrary coordinates
            return;
        }

        const view = this.olMap.getView();
        view.setCenter(
            fromLonLat([coordinates.longitude, coordinates.latitude])
        );
        view.setZoom(coordinates.zoom ?? OlMapManager.defaultZoom);
    }

    public getCoordinatesAsQueryParams() {
        const coordinates = this.getLonLat();
        if (!coordinates) return;
        return olMapCoordinatesSchema.encode({
            longitude: coordinates[0]!,
            latitude: coordinates[1]!,
            zoom: this.olMap.getView().getZoom(),
        });
    }

    public changeZoom(mode: 'zoomIn' | 'zoomOut') {
        const delta = mode === 'zoomIn' ? 1 : -1;
        const view = this.olMap.getView();
        view.animate({
            zoom: (view.getZoom() ?? OlMapManager.defaultZoom) + delta,
            duration: 200,
        });
    }

    public destroy() {
        this.destroy$.next();
        this.olMap.dispose();
        this.olMap.setTarget(undefined);
    }

    // This lets featureManagers register themselves and adds them to the layerFeatureManagerDictionary

    private registerFeatureManagers() {
        this.featureManagers.forEach((featureManager) => {
            this.layerFeatureManagerDictionary.set(
                featureManager.layer,
                featureManager
            );
            featureManager.register(this.destroy$, this.mapInteractionsManager);
        });
    }

    private initializeFeatureManagers() {
        const transferLinesFeatureManager = new TransferLinesFeatureManager(
            this.store,
            this.transferLinesService,
            this.olMap
        );
        const transferPointFeatureManager = new TransferPointFeatureManager(
            this.olMap,
            this.store,
            this.exerciseService,
            this.popupService
        );
        const patientFeatureManager = new PatientFeatureManager(
            this.store,
            this.olMap,
            this.exerciseService,
            this.popupService
        );
        const vehicleFeatureManager = new VehicleFeatureManager(
            this.olMap,
            this.store,
            this.exerciseService,
            this.popupService
        );
        const personnelFeatureManager = new PersonnelFeatureManager(
            this.olMap,
            this.store,
            this.exerciseService,
            this.popupService
        );
        const materialFeatureManager = new MaterialFeatureManager(
            this.olMap,
            this.store,
            this.exerciseService,
            this.popupService
        );
        const mapImageFeatureManager = new MapImageFeatureManager(
            this.olMap,
            this.exerciseService,
            this.store,
            this.popupService
        );
        const cateringLinesFeatureManager = new CateringLinesFeatureManager(
            this.store,
            this.olMap
        );

        const restrictedZoneFeatureManager = new RestrictedZoneFeatureManager(
            this.olMap,
            this.exerciseService,
            this.store,
            this.popupService
        );

        const technicalChallengeFeatureManager =
            new TechnicalChallengeFeatureManager(
                this.olMap,
                this,
                this.exerciseService,
                this.store,
                this.popupService
            );

        const viewportFeatureManager = new ViewportFeatureManager(
            this.olMap,
            this.exerciseService,
            this.store,
            this.popupService
        );
        const simulatedRegionFeatureManager = new SimulatedRegionFeatureManager(
            this.olMap,
            this.exerciseService,
            this.store,
            this.popupService
        );

        const deleteFeatureManager = new DeleteFeatureManager(
            this.store,
            this.olMap,
            this.exerciseService
        );

        // Register the Feature Managers in the correct Order
        // The order represents the order of the layers on the map (last element is on top)

        this.featureManagers = [
            deleteFeatureManager,
            restrictedZoneFeatureManager,
            transferLinesFeatureManager,
            simulatedRegionFeatureManager,
            technicalChallengeFeatureManager,
            mapImageFeatureManager,
            transferPointFeatureManager,
            vehicleFeatureManager,
            cateringLinesFeatureManager,
            patientFeatureManager,
            personnelFeatureManager,
            materialFeatureManager,
            viewportFeatureManager,
        ];

        this.featureNameFeatureManagerDictionary.set(
            'vehicle',
            vehicleFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'patient',
            patientFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'personnel',
            personnelFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'material',
            materialFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'transferLine',
            transferLinesFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'transferPoint',
            transferPointFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'mapImage',
            mapImageFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'cateringLine',
            cateringLinesFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'viewport',
            viewportFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'restrictedZone',
            restrictedZoneFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'technicalChallenge',
            technicalChallengeFeatureManager
        );
        this.featureNameFeatureManagerDictionary.set(
            'delete',
            deleteFeatureManager
        );
    }
}
