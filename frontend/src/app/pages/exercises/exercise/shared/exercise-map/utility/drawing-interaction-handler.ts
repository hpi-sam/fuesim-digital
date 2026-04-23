import { newMapCoordinatesAt } from 'fuesim-digital-shared';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import Draw from 'ol/interaction/Draw';
import type { Coordinate } from 'ol/coordinate';
import { Polygon, LineString } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { asArray } from 'ol/color';
import type {
    DrawingInteractionService,
    DrawRequest,
} from '../../../../../../core/drawing-interaction.service';

export class DrawingInteractionHandler {
    constructor(
        private readonly olMap: OlMap,
        private readonly drawingInteractionService: DrawingInteractionService,
        private readonly destroy$: Subject<void>
    ) {
        this.drawingInteractionService.onDrawRequest$
            .pipe(takeUntil(destroy$))
            .subscribe((request) => this.handleDrawRequest(request));
    }

    private handleDrawRequest(request: DrawRequest) {
        const isFreehand = request.drawingType === 'freehand';
        const drawType = isFreehand ? 'Polygon' : 'LineString';

        const olDraw = new Draw({
            type: drawType,
            freehand: isFreehand,
            style: (feature) => {
                const geometryType = feature.getGeometry()?.getType();
                const fill = [...asArray(request.fillColor ?? '#000000')];
                fill[3] = 0.2;
                if (geometryType === 'Point') {
                    return new Style({
                        image: new CircleStyle({
                            radius: 4,
                            fill: new Fill({ color: fill }),
                            stroke: new Stroke({ color: request.strokeColor }),
                        }),
                    });
                }
                return new Style({
                    fill: new Fill({ color: fill }),
                    stroke: new Stroke({
                        color: request.strokeColor,
                        width: isFreehand ? 2 : 5,
                    }),
                });
            },
        });

        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cleanup();
                this.drawingInteractionService.completeDrawing(null);
            }
        };

        const handleEvent = (e: boolean | null) => {
            switch (e) {
                case null:
                    break;
                case true:
                    // eslint-disable-next-line no-void
                    void olDraw.finishDrawing();
                    break;
                case false:
                    olDraw.abortDrawing();
                    cleanup();
                    this.drawingInteractionService.completeDrawing(null);
                    break;
            }
        };
        const endEventSubscription = request.endEvent
            .pipe(takeUntil(this.destroy$))
            .subscribe((e) => handleEvent(e));

        const cleanup = async () => {
            await this.olMap.removeInteraction(olDraw);
            document.removeEventListener('keydown', escapeHandler);
            endEventSubscription.unsubscribe();
        };

        olDraw.on('drawend', (event) => {
            const geometry = event.feature.getGeometry();
            if (!geometry) {
                cleanup();
                this.drawingInteractionService.completeDrawing(null);
                return;
            }

            let rawCoords: Coordinate[];
            if (geometry instanceof Polygon) {
                const ring = geometry.getCoordinates()[0];
                if (!ring || ring.length < 3) {
                    cleanup();
                    this.drawingInteractionService.completeDrawing(null);
                    return;
                }
                // Remove the closing point (OL auto-closes polygon rings)
                rawCoords = ring.slice(0, -1);
            } else if (geometry instanceof LineString) {
                rawCoords = geometry.getCoordinates();
                if (rawCoords.length < 2) {
                    cleanup();
                    this.drawingInteractionService.completeDrawing(null);
                    return;
                }
            } else {
                cleanup();
                this.drawingInteractionService.completeDrawing(null);
                return;
            }

            const points = rawCoords.map((coord) =>
                newMapCoordinatesAt(coord[0]!, coord[1]!)
            );

            cleanup();
            this.drawingInteractionService.completeDrawing({ points });
        });

        document.addEventListener('keydown', escapeHandler);
        this.olMap.addInteraction(olDraw);
    }
}
