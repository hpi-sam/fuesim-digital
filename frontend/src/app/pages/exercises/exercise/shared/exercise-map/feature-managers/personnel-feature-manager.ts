import type { Store } from '@ngrx/store';
import type { Personnel, UUID } from 'fuesim-digital-shared';
import { isTechnicalChallenge, normalZoom } from 'fuesim-digital-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type OlMap from 'ol/Map';
import { type Observable, type Subject, takeUntil } from 'rxjs';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import type { Point } from 'ol/geom';
import type { FeatureLike } from 'ol/Feature';
import { PersonnelPopupComponent } from '../shared/personnel-popup/personnel-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/image-popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { CircleStyleHelper } from '../utility/style-helper/circle-style-helper';
import type { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectVisiblePersonnel } from '../../../../../../state/application/selectors/shared.selectors';
import type { Positions } from '../utility/geometry-helper';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class PersonnelFeatureManager extends MoveableFeatureManager<Personnel> {
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisiblePersonnel),
            destroy$,
            mapInteractionsManager
        );

        this.trackWorkingPersonnel(destroy$);
    }
    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature) => (this.getElementFromFeature(feature) as Personnel).image
    );
    private readonly nameStyleHelper = new NameStyleHelper(
        (feature) => {
            const personnel = this.getElementFromFeature(feature) as Personnel;
            return {
                name: personnel.vehicleName,
                offsetY: personnel.image.height / 2 / normalZoom,
            };
        },
        0.025,
        'top'
    );

    private workingPersonnel!: Set<UUID>;

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

    private readonly currentlyWorkingStyleHelper = new CircleStyleHelper(
        (feature) => ({
            radius: 25,
            fill: new Fill({ color: 'green' }),
        }),
        0.025,
        (feature) => [1, 1.5]
    );

    constructor(
        olMap: OlMap,
        private readonly store: Store<AppState>,
        exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            async (targetPosition, personnel) =>
                exerciseService.proposeAction(
                    {
                        type: '[Personnel] Move personnel',
                        personnelId: personnel.id,
                        targetPosition,
                    },
                    true
                ),
            new PointGeometryHelper()
        );

        this.layer.setStyle((feature, resolution) => {
            const personnel = this.getElementFromFeature(
                feature as Feature
            ) as Personnel;

            const styles = [
                this.nameStyleHelper.getStyle(feature as Feature, resolution),
                this.imageStyleHelper.getStyle(feature as Feature, resolution),
            ];

            if (this.workingPersonnel.has(personnel.id)) {
                styles.push(
                    this.currentlyWorkingStyleHelper.getStyle(
                        feature as Feature,
                        resolution
                    )
                );
            }
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

        this.popupService.togglePopup(
            this.popupHelper.getPopupOptions(
                PersonnelPopupComponent,
                feature,
                [feature.getId() as UUID],
                [
                    feature.getId() as UUID,
                    (this.getElementFromFeature(feature) as Personnel)
                        .vehicleId,
                ],
                [feature.getId() as UUID],
                ['personnel', 'vehicle'],
                {
                    personnelId: feature.getId() as UUID,
                }
            )
        );
    }

    private trackWorkingPersonnel($destroy: Observable<void>) {
        this.store
            .select((state) => {
                // TODO: move selector into helper.
                // TODO: reduce number of state changes
                // TODO: think about using bilateral mapping to depend on
                //       the state of the personnel in question.
                const workingPersonnelSet = new Set<UUID>();
                const challenges = Object.values(
                    state.application.exerciseState!.technicalChallenges
                );
                for (const challenge of challenges) {
                    // eslint-disable-next-line guard-for-in
                    for (const personnelId in challenge.assignedPersonnel) {
                        workingPersonnelSet.add(personnelId);
                    }
                }
                return workingPersonnelSet;
            })
            .pipe(takeUntil($destroy))
            .subscribe((workingPersonnel) => {
                this.workingPersonnel = workingPersonnel;
                this.layer.changed();
            });
    }

    protected override async onTranslateEnd(
        newPosition: Positions<Point>,
        element: Personnel,
        elementFeature: Feature<Point>
    ): Promise<void> {
        // check if on technical challenge
        const pixel = this.olMap.getPixelFromCoordinate([
            newPosition.x,
            newPosition.y,
        ]);
        const features = this.olMap.getFeaturesAtPixel(pixel);
        const isFeatureLikeTechnicalChallenge = (f: FeatureLike) =>
            isTechnicalChallenge(this.getElementFromFeature(f as Feature));
        const challenge = features.find(isFeatureLikeTechnicalChallenge);
        if (challenge) {
            return;
        }

        return super.onTranslateEnd(newPosition, element, elementFeature);
    }
}
