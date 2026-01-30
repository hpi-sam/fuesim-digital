import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { defaultTileMapProperties } from 'digital-fuesim-manv-shared';
import maplibregl, { MercatorCoordinate } from 'maplibre-gl';
import { AppState } from '../../../../../../../state/app.state';
import { selectViewports } from '../../../../../../../state/application/selectors/exercise.selectors';
import { map } from 'rxjs';
import { startingPosition } from '../../../starting-position';

@Component({
    selector: 'app-operations-map',
    standalone: false,
    templateUrl: './operations-map.component.html',
    styleUrl: './operations-map.component.scss',
})
export class OperationsMapComponent implements OnInit {
    constructor(private readonly store: Store<AppState>) { }

    public availableViewports$ = this.store
        .select(selectViewports)
        .pipe(map((viewports) => Object.values(viewports)));

    @ViewChild('mapContainer', { static: true })
    public mapContainerRef: ElementRef<HTMLElement> | undefined;

    ngOnInit(): void {
        console.log('Initializing operations map');


        var map = new maplibregl.Map({
            container: this.mapContainerRef?.nativeElement!,
            style: {
                version: 8,
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: [defaultTileMapProperties.tileUrl],
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
                        id: 'simple-tiles',
                        type: 'raster',
                        source: 'raster-tiles',
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
                        },
                    },
                ],
            },
            center: this.metersToLngLat(
                [startingPosition.x, startingPosition.y]
            ),
            zoom: 17,
        });
        map.on('load', () => {
            map.resize();
        });
    }

    // conversion from EPSG:3857 (what OpenLayers uses) to 4326 (MapLibre)
    // https://stackoverflow.com/a/70201137
    metersToLngLat(coords: [number, number]): [number, number] {
        const e_value = 2.7182818284;
        const X = 20037508.34;

        const lat3857 = coords[1];
        const long3857 = coords[0];

        //converting the longitute from epsg 3857 to 4326
        const long4326 = (long3857 * 180) / X;

        //converting the latitude from epsg 3857 to 4326 split in multiple lines for readability
        let lat4326 = lat3857 / (X / 180);
        const exponent = (Math.PI / 180) * lat4326;

        lat4326 = Math.atan(Math.pow(e_value, exponent));
        lat4326 = lat4326 / (Math.PI / 360); // Here is the fixed line
        lat4326 = lat4326 - 90;

        return [long4326, lat4326];
    }
}
