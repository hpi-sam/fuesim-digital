import type { Store } from '@ngrx/store';
import type { MapImage, UUID } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectCurrentRole,
    selectVisibleMapImages,
} from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { MapImagePopupComponent } from '../shared/map-image-popup/map-image-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import type { PopupService } from '../utility/popup.service';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class MapImageFeatureManager extends MoveableFeatureManager<MapImage> {
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleMapImages),
            destroy$,
            mapInteractionsManager
        );
    }
    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => (this.getElementFromFeature(feature) as MapImage).image
    );
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    constructor(
        olMap: OlMap,
        exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            (targetPosition, mapImage) => {
                exerciseService.proposeAction(
                    {
                        type: '[MapImage] Move MapImage',
                        mapImageId: mapImage.id,
                        targetPosition,
                    },
                    true
                );
            },
            new PointGeometryHelper(),
            10_000
        );
        this.layer.setStyle((feature, resolution) => {
            const style = this.imageStyleHelper.getStyle(
                feature as Feature,
                resolution
            );
            style.setZIndex(
                (this.getElementFromFeature(feature as Feature) as MapImage)
                    .zIndex
            );
            return style;
        });
    }

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);

        if (selectStateSnapshot(selectCurrentRole, this.store) !== 'trainer') {
            return;
        }
        this.popupService.openPopup(
            this.popupHelper.getPopupOptions(
                MapImagePopupComponent,
                feature,
                [feature.getId() as UUID],
                [],
                [],
                [],
                {
                    mapImageId: feature.getId() as UUID,
                }
            )
        );
    }

    override isFeatureTranslatable(feature: Feature<Point>): boolean {
        const mapImage = this.getElementFromFeature(feature) as MapImage;
        return (
            selectStateSnapshot(selectCurrentRole, this.store) === 'trainer' &&
            !mapImage.isLocked
        );
    }
}
