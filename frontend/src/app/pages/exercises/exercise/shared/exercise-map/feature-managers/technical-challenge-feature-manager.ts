import type { Store } from '@ngrx/store';
import type {
    MoveTechnicalChallengeAction,
    TechnicalChallenge,
    UUID,
} from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import { TechnicalChallengePopupComponent } from '../shared/technical-challenge-popup/technical-challenge-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import type { PopupService } from '../utility/popup.service';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import {
    selectCurrentMainRole,
    selectVisibleTechnicalChallenges,
} from '../../../../../../state/application/selectors/shared.selectors';
import { ImagePopupHelper } from '../utility/image-popup-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class TechnicalChallengeFeatureManager extends MoveableFeatureManager<TechnicalChallenge> {
    public override register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleTechnicalChallenges),
            destroy$,
            mapInteractionsManager
        );

        // TODO: listen for state changes
    }

    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) =>
            (this.getElementFromFeature(feature) as TechnicalChallenge).image
    );
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    constructor(
        olMap: OlMap,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            async (targetPosition, technicalChallenge) =>
                exerciseService.proposeAction({
                    type: '[TechnicalChallenge] Move technical challenge',
                    technicalChallengeId: technicalChallenge.id,
                    targetPosition,
                } satisfies MoveTechnicalChallengeAction),
            new PointGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) =>
            this.imageStyleHelper.getStyle(feature as Feature, resolution)
        );
    }

    public override onFeatureClicked(
        event: MapBrowserEvent<any>,
        feature: Feature<any>
    ): void {
        super.onFeatureClicked(event, feature);

        this.popupService.togglePopup(
            this.popupHelper.getPopupOptions(
                TechnicalChallengePopupComponent,
                feature,
                [feature.getId() as UUID],
                [],
                [],
                [],
                {
                    technicalChallengeId: feature.getId() as UUID,
                }
            )
        );
    }

    override isFeatureTranslatable(feature: Feature<Point>): boolean {
        return (
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
        );
    }
}
