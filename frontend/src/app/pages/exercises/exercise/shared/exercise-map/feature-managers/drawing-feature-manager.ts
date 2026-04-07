import type { Store } from '@ngrx/store';
import type { Feature } from 'ol';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { Drawing, MapCoordinates } from 'fuesim-digital-shared';
import { asArray } from 'ol/color';
import { Fill, Stroke, Style } from 'ol/style';
import { LineString, Polygon } from 'ol/geom';
import type { Pixel } from 'ol/pixel';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import type { AppState } from '../../../../../../state/app.state';
import { selectVisibleDrawings } from '../../../../../../state/application/selectors/shared.selectors';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import { DrawingGeometryHelper } from '../utility/drawing-geometry-helper';
import { TranslateInteraction } from '../utility/translate-interaction';
import type { Positions } from '../utility/geometry-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class DrawingFeatureManager
    extends MoveableFeatureManager<Drawing, LineString | Polygon>
    implements FeatureManager<LineString | Polygon>
{
    private readonly maxPixelDistanceToBorder = 8;

    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleDrawings),
            destroy$,
            mapInteractionsManager
        );
    }

    constructor(
        olMap: OlMap,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {
        super(
            olMap,
            async (targetPositions, drawing) => {
                const points = this.extractPoints(targetPositions, drawing);
                return this.exerciseService.proposeAction(
                    {
                        type: '[Drawing] Move drawing',
                        drawingId: drawing.id,
                        newPoints: points,
                    },
                    true
                );
            },
            new DrawingGeometryHelper()
        );
        this.layer.setStyle((feature) => [
            this.getStyleForFeature(feature as Feature<LineString | Polygon>),
        ]);
    }

    private extractPoints(
        targetPositions: Positions<LineString | Polygon>,
        drawing: Drawing
    ): MapCoordinates[] {
        if (drawing.drawingType === 'freehand') {
            const rings = targetPositions as MapCoordinates[][];
            return this.normalizePoints(rings[0]);
        }
        return targetPositions as MapCoordinates[];
    }

    private normalizePoints(
        ring: readonly MapCoordinates[] | undefined
    ): MapCoordinates[] {
        if (!ring || ring.length === 0) {
            return [];
        }

        const points = [...ring];
        if (points.length > 1) {
            const first = points[0]!;
            const last = points.at(-1)!;
            if (first.x === last.x && first.y === last.y) {
                points.pop();
            }
        }

        return points;
    }

    private getStyleForFeature(feature: Feature<LineString | Polygon>): Style {
        const drawing = this.getElementFromFeature(feature);
        if (!drawing) {
            return new Style({
                stroke: new Stroke({
                    color: '#000000',
                    width: 2,
                }),
            });
        }

        if (drawing.drawingType === 'freehand' && drawing.fillColor) {
            const fill = [...asArray(drawing.fillColor)];
            fill[3] = 0.2;

            return new Style({
                fill: new Fill({ color: fill }),
                stroke: new Stroke({
                    color: drawing.strokeColor,
                    width: 2,
                }),
            });
        }

        return new Style({
            stroke: new Stroke({
                color: drawing.strokeColor,
                width: 2,
            }),
        });
    }

    override createFeature(element: Drawing): Feature<LineString | Polygon> {
        const feature = super.createFeature(element);
        TranslateInteraction.setTranslateStartAllowedPredicate(
            feature,
            (f, event) => this.isPointerOnDrawingBorder(f, event.pixel)
        );
        return feature;
    }

    private isPointerOnDrawingBorder(feature: Feature, pixel: Pixel): boolean {
        const geometry = feature.getGeometry();
        if (!geometry) {
            return false;
        }

        let ring;
        if (geometry instanceof Polygon) {
            ring = geometry.getCoordinates()[0];
        } else if (geometry instanceof LineString) {
            ring = geometry.getCoordinates();
        }

        if (!ring || ring.length < 2) {
            return false;
        }

        const segmentCount =
            geometry instanceof Polygon ? ring.length - 1 : ring.length - 1;

        for (let index = 0; index < segmentCount; index++) {
            const start = ring[index]!;
            const end = ring[index + 1]!;
            const distance = pointToSegmentDistance(
                pixel,
                this.olMap.getPixelFromCoordinate(start),
                this.olMap.getPixelFromCoordinate(end)
            );
            if (distance <= this.maxPixelDistanceToBorder) {
                return true;
            }
        }

        return false;
    }

    public override isFeatureTranslatable(
        _feature: Feature<LineString | Polygon>
    ): boolean {
        return true;
    }
}

function pointToSegmentDistance(
    point: Pixel,
    segmentStart: Pixel,
    segmentEnd: Pixel
): number {
    const pointX = point[0]!;
    const pointY = point[1]!;
    const startX = segmentStart[0]!;
    const startY = segmentStart[1]!;
    const endX = segmentEnd[0]!;
    const endY = segmentEnd[1]!;

    const dx = endX - startX;
    const dy = endY - startY;
    const denominator = dx * dx + dy * dy;

    if (denominator === 0) {
        return Math.hypot(pointX - startX, pointY - startY);
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            ((pointX - startX) * dx + (pointY - startY) * dy) / denominator
        )
    );

    const projectedX = startX + t * dx;
    const projectedY = startY + t * dy;
    return Math.hypot(pointX - projectedX, pointY - projectedY);
}
