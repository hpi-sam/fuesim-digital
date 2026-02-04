import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    defaultTileMapProperties,
    lowerRightCornerOf,
    upperLeftCornerOf,
    Viewport,
} from 'digital-fuesim-manv-shared';
import maplibregl from 'maplibre-gl';
// eslint-disable-next-line no-restricted-imports
import 'maplibre-gl/dist/maplibre-gl.css';
import { map, first, Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/state/app.state';
import {
    selectTileMapProperties,
    selectViewports,
} from 'src/app/state/application/selectors/exercise.selectors';
import { startingPosition } from '../../../starting-position';

@Component({
    selector: 'app-operations-map',
    standalone: false,
    templateUrl: './operations-map.component.html',
    styleUrl: './operations-map.component.scss',
})
export class OperationsMapComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    constructor(private readonly store: Store<AppState>) {}

    public availableViewports$ = this.store
        .select(selectViewports)
        .pipe(map((viewports) => Object.values(viewports)));

    private readonly tileMapPropertiesSubscription = this.store
        .select(selectTileMapProperties)
        .pipe(takeUntil(this.destroy$))
        .subscribe((tileMapProperties) => {
            const source = this.map?.getSource(
                'raster-tiles'
            ) as maplibregl.RasterTileSource | null;
            if (!source) return;

            source.setTiles([tileMapProperties.tileUrl]);
            this.map?.triggerRepaint();
        });

    @ViewChild('mapContainer', { static: true })
    public mapContainerRef: ElementRef<HTMLElement> | undefined;
    private map: maplibregl.Map | undefined;
    public is3dBuildingsEnabled = true;
    private readonly savedViewSettings: { bearing: number; pitch: number } = {
        bearing: -15,
        pitch: 37,
    };
    public readonly MAX_PITCH_3D_BUILDINGS = 60;

    public switchViewToViewport(viewport: Viewport) {
        if (!this.map) return;

        const ulCorner = upperLeftCornerOf(viewport);
        const lrCorner = lowerRightCornerOf(viewport);

        this.map.fitBounds(
            [
                {
                    lat: this.metersToLngLat([ulCorner.x, ulCorner.y])[1],
                    lng: this.metersToLngLat([ulCorner.x, ulCorner.y])[0],
                },
                {
                    lat: this.metersToLngLat([lrCorner.x, lrCorner.y])[1],
                    lng: this.metersToLngLat([lrCorner.x, lrCorner.y])[0],
                },
            ],
            { animate: true, padding: 50, duration: 500 }
        );
    }

    public toggle3DBuildings() {
        if (!this.map) return;

        this.is3dBuildingsEnabled = !this.is3dBuildingsEnabled;
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
        if (!this.mapContainerRef) {
            throw new Error('Map container reference is undefined');
        }
        this.store
            .select(selectTileMapProperties)
            .pipe(first(), takeUntil(this.destroy$))
            .subscribe((tileMapProperties) => {
                this.initMap(tileMapProperties.tileUrl);
            });
    }

    private initMap(defaultTileUrl: string = defaultTileMapProperties.tileUrl) {
        this.map = new maplibregl.Map({
            container: this.mapContainerRef!.nativeElement,
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
                        url: `https://tiles.openfreemap.org/planet`,
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
            zoom: 17,
            bearing: this.savedViewSettings.bearing,
            pitch: this.savedViewSettings.pitch,
            maxPitch: this.MAX_PITCH_3D_BUILDINGS,
        });
        this.map.on('load', () => {
            this.map?.resize();
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
        this.tileMapPropertiesSubscription.unsubscribe();
        this.map?.remove();
        this.destroy$.next();
    }
}
