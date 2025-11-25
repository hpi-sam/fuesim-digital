import type { Store } from '@ngrx/store';
import type { MapImage, UUID } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point.js';
import type OlMap from 'ol/Map.js';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import {
    selectCurrentMainRole,
    selectVisibleMapImages,
} from 'src/app/state/application/selectors/shared.selectors.js';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot.js';
import { MapImagePopupComponent } from '../shared/map-image-popup/map-image-popup.component.js';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager.js';
import { PointGeometryHelper } from '../utility/point-geometry-helper.js';
import { ImagePopupHelper } from '../utility/popup-helper.js';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper.js';
import type { PopupService } from '../utility/popup.service.js';
import { MoveableFeatureManager } from './moveable-feature-manager.js';

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

        if (
            selectStateSnapshot(selectCurrentMainRole, this.store) !== 'trainer'
        ) {
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
            selectStateSnapshot(selectCurrentMainRole, this.store) ===
                'trainer' && !mapImage.isLocked
        );
    }
}
