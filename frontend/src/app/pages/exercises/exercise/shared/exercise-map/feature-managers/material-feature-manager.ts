import type { Store } from '@ngrx/store';
import type { Material, UUID } from 'digital-fuesim-manv-shared';
import { normalZoom } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { selectVisibleMaterials } from 'src/app/state/application/selectors/shared.selectors';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { MaterialPopupComponent } from '../shared/material-popup/material-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { CircleStyleHelper } from '../utility/style-helper/circle-style-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class MaterialFeatureManager extends MoveableFeatureManager<Material> {
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleMaterials),
            destroy$,
            mapInteractionsManager
        );
    }
    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => (this.getElementFromFeature(feature) as Material).image
    );
    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const material = this.getElementFromFeature(feature) as Material;
            return {
                name: material.vehicleName,
                offsetY: material.image.height / 2 / normalZoom,
            };
        },
        0.025,
        'top'
    );

    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    private readonly openPopupCircleStyleHelper = new CircleStyleHelper(
        (_) => ({
            radius: 75,
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
        exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            (targetPosition, material) => {
                exerciseService.proposeAction(
                    {
                        type: '[Material] Move material',
                        materialId: material.id,
                        targetPosition,
                    },
                    true
                );
            },
            new PointGeometryHelper()
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

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);

        this.popupService.openPopup(
            this.popupHelper.getPopupOptions(
                MaterialPopupComponent,
                feature,
                [feature.getId() as UUID],
                [
                    feature.getId() as UUID,
                    (this.getElementFromFeature(feature) as Material).vehicleId,
                ],
                [feature.getId() as UUID],
                ['material', 'vehicle'],
                {
                    materialId: feature.getId() as UUID,
                }
            )
        );
    }
}
