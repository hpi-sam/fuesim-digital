import type { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Patient } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type OlMap from 'ol/Map';
import { Fill, Stroke } from 'ol/style';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { selectConfiguration } from 'src/app/state/application/selectors/exercise.selectors';
import { selectVisiblePatients } from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { PatientPopupComponent } from '../shared/patient-popup/patient-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/popup-helper';
import { CircleStyleHelper } from '../utility/style-helper/circle-style-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import type { PopupService } from '../utility/popup.service';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class PatientFeatureManager extends MoveableFeatureManager<Patient> {
    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ): void {
        super.registerFeatureElementManager(
            this.store.select(selectVisiblePatients),
            destroy$,
            mapInteractionsManager
        );
    }
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    private readonly imageStyleHelper = new ImageStyleHelper((feature) => {
        const patient = this.getElementFromFeature(feature) as Patient;
        return {
            ...patient.image,
            rotation: patient.pretriageInformation.isWalkable
                ? undefined
                : (3 * Math.PI) / 2,
        };
    });

    private readonly visibleStatusCircleStyleHelper = new CircleStyleHelper(
        (feature) => {
            const patient = this.getElementFromFeature(feature) as Patient;
            const configuration = selectStateSnapshot(
                selectConfiguration,
                this.store
            );
            const color = Patient.getVisibleStatus(
                patient,
                configuration.pretriageEnabled,
                configuration.bluePatientsEnabled
            );
            return {
                radius: 8,
                fill: new Fill({
                    color,
                }),
                stroke: new Stroke({
                    color: 'white',
                    width: 1,
                }),
            };
        },
        0.025,
        (feature) =>
            (this.getElementFromFeature(feature) as Patient)
                .pretriageInformation.isWalkable
                ? [0, 0.25]
                : [-0.25, 0]
    );

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
        private readonly store: Store<AppState>,
        olMap: OlMap,
        exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            (targetPosition, patient) => {
                exerciseService.proposeAction(
                    {
                        type: '[Patient] Move patient',
                        patientId: patient.id,
                        targetPosition,
                    },
                    true
                );
            },
            new PointGeometryHelper()
        );
        this.layer.setStyle((feature, resolution) => {
            const styles = [
                this.imageStyleHelper.getStyle(feature as Feature, resolution),
                this.visibleStatusCircleStyleHelper.getStyle(
                    feature as Feature,
                    resolution
                ),
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
                PatientPopupComponent,
                feature,
                [feature.getId() as UUID],
                [feature.getId() as UUID],
                [feature.getId() as UUID],
                ['patient'],
                {
                    patientId: feature.getId() as UUID,
                }
            )
        );
    }
}
