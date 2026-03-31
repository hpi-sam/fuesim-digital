import {
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    OnDestroy,
    viewChild,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import maplibregl from 'maplibre-gl';
// eslint-disable-next-line no-restricted-imports
import 'maplibre-gl/dist/maplibre-gl.css';
import { upperLeftCornerOf, lowerRightCornerOf } from 'fuesim-digital-shared';
import { startingPosition } from '../../../starting-position';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectViewports,
    selectSimulatedRegions,
    selectOperationsMapProperties,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-operations-map',
    templateUrl: './operations-map.component.html',
    styleUrl: './operations-map.component.scss',
})
export class OperationsMapComponent implements OnDestroy {
    private readonly store = inject(Store<AppState>);

    public readonly INITIAL_ZOOM = 17;
    public readonly MAX_PITCH_3D_BUILDINGS = 60;

    private readonly savedViewSettings: { bearing: number; pitch: number } = {
        bearing: -15,
        pitch: 37,
    };
    public readonly mapContainerRef =
        viewChild<ElementRef<HTMLElement>>('mapContainer');
    private map: maplibregl.Map | undefined;

    public readonly are3dBuildingsEnabled = signal<boolean>(true);

    private readonly mapReady = signal<boolean>(false);

    private readonly availableViewportsMap =
        this.store.selectSignal(selectViewports);
    public readonly availableViewports = computed(() =>
        Object.values(this.availableViewportsMap())
    );

    public readonly operationsMapProperties = this.store.selectSignal(
        selectOperationsMapProperties
    );

    constructor() {
        const initializationEffectRef = effect(() => {
            this.initMap();
            initializationEffectRef.destroy();
        });

        effect(() => {
            this.updateDisplay3DBuildings();
            this.updateTileSources();
        });
    }

    public goToHomeLocation(animate = true) {
        if (!this.mapReady() || !this.map) return;

        const elements = [
            ...Object.values(selectStateSnapshot(selectViewports, this.store)),
            ...Object.values(
                selectStateSnapshot(selectSimulatedRegions, this.store)
            ),
        ];

        if (elements.length === 0) {
            this.map.flyTo({
                center: this.metersToLngLat([
                    startingPosition.x,
                    startingPosition.y,
                ]),
                zoom: this.INITIAL_ZOOM,
                animate,
            });
            return;
        }
        const minX = Math.min(
            ...elements.map((element) => upperLeftCornerOf(element).x)
        );
        const minY = Math.min(
            ...elements.map((element) => lowerRightCornerOf(element).y)
        );
        const maxX = Math.max(
            ...elements.map((element) => lowerRightCornerOf(element).x)
        );
        const maxY = Math.max(
            ...elements.map((element) => upperLeftCornerOf(element).y)
        );

        this.map.fitBounds(
            [
                this.metersToLngLat([minX, minY]),
                this.metersToLngLat([maxX, maxY]),
            ],
            { padding: 25, animate }
        );
    }

    public updateTileSources() {
        if (!this.mapReady() || !this.map) return;

        const source: maplibregl.RasterTileSource =
            this.map.getSource('openfreemap')!;
        const newDataUrl = this.operationsMapProperties().dataUrl;
        if (source.url !== newDataUrl) {
            source.setUrl(this.operationsMapProperties().dataUrl);
        }

        const tilesSource: maplibregl.RasterTileSource =
            this.map.getSource('raster-tiles')!;
        const newTileUrl = this.operationsMapProperties().dataUrl;
        if (tilesSource.url !== newTileUrl) {
            tilesSource.setTiles([this.operationsMapProperties().tileUrl]);
        }

        this.map.triggerRepaint();
    }

    public toggle3DBuildings() {
        this.are3dBuildingsEnabled.set(!this.are3dBuildingsEnabled());
    }

    public updateDisplay3DBuildings() {
        if (!this.mapReady() || !this.map) return;

        const enabled =
            this.are3dBuildingsEnabled() &&
            this.operationsMapProperties().enable3dBuildings;

        const visibility = enabled ? 'visible' : 'none';

        this.map.setLayoutProperty('3d-buildings', 'visibility', visibility);
        this.map.setLayoutProperty(
            'building-outline',
            'visibility',
            visibility
        );

        if (enabled) {
            this.map.setMaxPitch(this.MAX_PITCH_3D_BUILDINGS);
            this.map.setPitch(this.savedViewSettings.pitch);
            this.map.setBearing(this.savedViewSettings.bearing);
            this.map.touchPitch.enable();
        } else {
            this.savedViewSettings.bearing = this.map.getBearing();
            this.savedViewSettings.pitch = this.map.getPitch();

            this.map.setPitch(0);
            this.map.setBearing(0);
            this.map.touchPitch.disable();
            this.map.setMaxPitch(0);
        }
    }

    private initMap() {
        const mapContainer = this.mapContainerRef()?.nativeElement;
        if (mapContainer === undefined) {
            throw new Error('Map container reference is undefined');
        }
        this.map = new maplibregl.Map({
            container: mapContainer,
            style: {
                version: 8,
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: [this.operationsMapProperties().tileUrl],
                        tileSize: 256,
                        minzoom: 0,
                        maxzoom: 19,
                    },
                    openfreemap: {
                        url: this.operationsMapProperties().dataUrl,
                        type: 'vector',
                    },
                },
                layers: [
                    {
                        id: 'tiles',
                        type: 'raster',
                        source: 'raster-tiles',
                    },
                    {
                        id: 'building-outline',
                        type: 'line',
                        source: 'openfreemap',
                        'source-layer': 'building',
                        minzoom: 16,
                        filter: ['!=', ['get', 'hide_3d'], true],
                        paint: {
                            'line-color': '#33333380',
                            'line-width': 8,
                            'line-gap-width': 0,
                        },
                    },
                    {
                        id: '3d-buildings',
                        source: 'openfreemap',
                        'source-layer': 'building',
                        type: 'fill-extrusion',
                        minzoom: 16,
                        filter: ['!=', ['get', 'hide_3d'], true],
                        paint: {
                            'fill-extrusion-color': 'lightgray',
                            'fill-extrusion-height': ['get', 'render_height'],
                            'fill-extrusion-base': ['get', 'render_min_height'],
                            'fill-extrusion-vertical-gradient': true,
                        },
                    },
                ],
            },
            center: this.metersToLngLat([
                startingPosition.x,
                startingPosition.y,
            ]),
            zoom: this.INITIAL_ZOOM,
            bearing: this.savedViewSettings.bearing,
            pitch: this.savedViewSettings.pitch,
            maxPitch: this.MAX_PITCH_3D_BUILDINGS,
        });
        this.map.on('load', () => {
            this.mapReady.set(true);
            this.map?.resize();
            this.goToHomeLocation(false);
        });
    }

    // conversion from EPSG:3857 (what OpenLayers uses) to 4326 (MapLibre)
    // https://stackoverflow.com/a/70201137
    metersToLngLat(coords: [number, number]): [number, number] {
        const eValue = 2.7182818284;
        const x = 20037508.34;

        const lat3857 = coords[1];
        const long3857 = coords[0];

        // converting the longitute from epsg 3857 to 4326
        const long4326 = (long3857 * 180) / x;

        // converting the latitude from epsg 3857 to 4326 split in multiple lines for readability
        let lat4326 = lat3857 / (x / 180);
        const exponent = (Math.PI / 180) * lat4326;

        lat4326 = Math.atan(Math.pow(eValue, exponent));
        lat4326 = lat4326 / (Math.PI / 360); // Here is the fixed line
        lat4326 = lat4326 - 90;

        return [long4326, lat4326];
    }

    ngOnDestroy(): void {
        this.map?.remove();
        this.map = undefined;
        this.mapReady.set(false);
    }
}
