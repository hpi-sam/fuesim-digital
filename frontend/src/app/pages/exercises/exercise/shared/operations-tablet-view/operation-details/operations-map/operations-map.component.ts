import {
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    viewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import maplibregl from 'maplibre-gl';
// eslint-disable-next-line no-restricted-imports
import 'maplibre-gl/dist/maplibre-gl.css';
import { first, Subject, takeUntil } from 'rxjs';
import {
    upperLeftCornerOf,
    lowerRightCornerOf,
    defaultTileMapProperties,
    defaultOperationsMapProperties,
} from 'fuesim-digital-shared';
import { startingPosition } from '../../../starting-position';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectViewports,
    selectSimulatedRegions,
    selectOperationsMapProperties,
    selectConfiguration,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-operations-map',
    templateUrl: './operations-map.component.html',
    styleUrl: './operations-map.component.scss',
})
export class OperationsMapComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly store = inject(Store<AppState>);
    public readonly INITIAL_ZOOM = 17;

    private readonly availableViewportsSignal =
        this.store.selectSignal(selectViewports);
    public readonly availableViewports = computed(() =>
        Object.values(this.availableViewportsSignal())
    );

    public readonly operationsMapProperties = this.store.selectSignal(
        selectOperationsMapProperties
    );

    constructor() {
        effect(() => {
            const operationsMapProperties = this.operationsMapProperties();
            this.is3dBuildingsEnabled =
                operationsMapProperties.enable3dBuildings;
            this.updateDisplay3DBuildings();

            const source = this.map?.getSource(
                'openfreemap'
            ) as maplibregl.RasterTileSource | null;
            if (source) {
                source.setUrl(operationsMapProperties.dataUrl);
            }

            const tilesSource = this.map?.getSource(
                'raster-tiles'
            ) as maplibregl.RasterTileSource | null;
            if (tilesSource) {
                tilesSource.setTiles([operationsMapProperties.tileUrl]);
            }

            this.map?.triggerRepaint();
        });
    }

    public readonly mapContainerRef =
        viewChild<ElementRef<HTMLElement>>('mapContainer');
    private map: maplibregl.Map | undefined;
    public is3dBuildingsEnabled = true;
    private readonly savedViewSettings: { bearing: number; pitch: number } = {
        bearing: -15,
        pitch: 37,
    };
    public readonly MAX_PITCH_3D_BUILDINGS = 60;

    public gotoHomeLocation(animate = true) {
        if (!this.map) return;

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

    public toggle3DBuildings() {
        if (!this.map) return;

        this.is3dBuildingsEnabled = !this.is3dBuildingsEnabled;
        this.updateDisplay3DBuildings();
    }

    public updateDisplay3DBuildings() {
        if (!this.map) return;

        const visibility = this.is3dBuildingsEnabled ? 'visible' : 'none';

        this.map.setLayoutProperty('3d-buildings', 'visibility', visibility);
        this.map.setLayoutProperty(
            'building-outline',
            'visibility',
            visibility
        );

        if (this.is3dBuildingsEnabled) {
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

    async ngOnInit() {
        if (!this.mapContainerRef()) {
            throw new Error('Map container reference is undefined');
        }
        this.store
            .select(selectConfiguration)
            .pipe(first(), takeUntil(this.destroy$))
            .subscribe((configuration) => {
                this.initMap(
                    configuration.tileMapProperties.tileUrl,
                    configuration.operationsMapProperties.dataUrl
                );
            });
    }

    private initMap(
        defaultTileUrl: string = defaultTileMapProperties.tileUrl,
        defaultOperationsMapUrl: string = defaultOperationsMapProperties.dataUrl
    ) {
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
                        tiles: [defaultTileUrl],
                        tileSize: 256,
                        minzoom: 0,
                        maxzoom: 19,
                    },
                    openfreemap: {
                        url: defaultOperationsMapUrl,
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
            this.map?.resize();
            this.gotoHomeLocation(false);
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
        this.destroy$.next();
    }
}
