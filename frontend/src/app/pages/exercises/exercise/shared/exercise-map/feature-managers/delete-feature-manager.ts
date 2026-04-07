import type { Store } from '@ngrx/store';
import type { MapBrowserEvent, View } from 'ol';
import { Feature } from 'ol';
import { getTopRight } from 'ol/extent';
import { Point } from 'ol/geom';
import type { TranslateEvent } from 'ol/interaction/Translate';
import VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import type { Subject } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from 'fuesim-digital-shared';
import type { FeatureManager } from '../utility/feature-manager';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectCurrentMainRole } from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';

function calculateTopRightViewPoint(view: View) {
    const extent = getTopRight(view.calculateExtent());
    return new Point([extent[0]!, extent[1]!]);
}

export class DeleteFeatureManager implements FeatureManager<Point> {
    readonly layer: VectorLayer;
    constructor(
        private readonly store: Store<AppState>,
        private readonly olMap: OlMap,
        private readonly exerciseService: ExerciseService
    ) {
        this.layer = new VectorLayer({
            // These two settings prevent clipping during animation/interaction but cause a performance hit -> disable if needed
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            renderBuffer: 250,
            source: new VectorSource<Feature<Point>>(),
        });
    }
    register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) {
        this.olMap.addLayer(this.layer);
        mapInteractionsManager.addFeatureLayer(this.layer);
        if (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        ) {
            this.makeVisible();
        }
    }
    public makeVisible() {
        this.layer.setStyle(
            new Style({
                image: new Icon({
                    opacity: 0.8,
                    anchorOrigin: 'top-right',
                    anchor: [-0.25, -0.25],
                    src: '/assets/trash-can.svg',
                    scale: 3,
                }),
            })
        );
        const view = this.olMap.getView();
        const point = calculateTopRightViewPoint(view);
        const deleteFeature = new Feature(point);
        this.layer.getSource()!.addFeature(deleteFeature);
        view.on(['change:resolution', 'change:center'], () => {
            deleteFeature.setGeometry(
                calculateTopRightViewPoint(this.olMap.getView())
            );
        });
    }

    public onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): void {}

    public isFeatureTranslatable(feature: Feature<Point>) {
        return false;
    }

    public onFeatureDrop(
        droppedElement: Element,
        droppedOnFeature: Feature<Point>,
        dropEvent: MouseEvent | TranslateEvent
    ) {
        const id = droppedElement.id;
        switch (droppedElement.type) {
            case 'patient': {
                this.exerciseService.proposeAction({
                    type: '[Patient] Remove patient',
                    patientId: id,
                });
                return true;
            }
            case 'vehicle': {
                this.exerciseService.proposeAction({
                    type: '[Vehicle] Remove vehicle',
                    vehicleId: id,
                });
                return true;
            }
            case 'mapImage': {
                this.exerciseService.proposeAction({
                    type: '[MapImage] Remove MapImage',
                    mapImageId: id,
                });
                return true;
            }
            case 'viewport': {
                this.exerciseService.proposeAction({
                    type: '[Viewport] Remove viewport',
                    viewportId: id,
                });
                return true;
            }
            case 'transferPoint': {
                this.exerciseService.proposeAction({
                    type: '[TransferPoint] Remove TransferPoint',
                    transferPointId: id,
                });
                return true;
            }
            case 'simulatedRegion': {
                this.exerciseService.proposeAction({
                    type: '[SimulatedRegion] Remove simulated region',
                    simulatedRegionId: id,
                });
                return true;
            }
            case 'restrictedZone': {
                this.exerciseService.proposeAction({
                    type: '[RestrictedZone] Remove restricted zone',
                    restrictedZoneId: id,
                });
                return true;
            }
            case 'drawing': {
                this.exerciseService.proposeAction({
                    type: '[Drawing] Remove drawing',
                    drawingId: id,
                });
                return true;
            }
            default: {
                return false;
            }
        }
    }
}
