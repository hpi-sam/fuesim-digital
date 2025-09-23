import type { Store } from '@ngrx/store';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { UUID, Element } from 'digital-fuesim-manv-shared';
import { TransferPoint, TransferStartPoint } from 'digital-fuesim-manv-shared';
import type { Feature, MapBrowserEvent } from 'ol';
import type Point from 'ol/geom/Point';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type OlMap from 'ol/Map';
import type { Subject } from 'rxjs';
import type { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectCurrentRole,
    selectVisibleTransferPoints,
} from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { ChooseTransferTargetPopupComponent } from '../shared/choose-transfer-target-popup/choose-transfer-target-popup.component';
import { TransferPointPopupComponent } from '../shared/transfer-point-popup/transfer-point-popup.component';
import type { OlMapInteractionsManager } from '../utility/ol-map-interactions-manager';
import { PointGeometryHelper } from '../utility/point-geometry-helper';
import { ImagePopupHelper } from '../utility/popup-helper';
import { ImageStyleHelper } from '../utility/style-helper/image-style-helper';
import { NameStyleHelper } from '../utility/style-helper/name-style-helper';
import type { PopupService } from '../utility/popup.service';
import { MoveableFeatureManager } from './moveable-feature-manager';

export class TransferPointFeatureManager extends MoveableFeatureManager<TransferPoint> {
    private readonly popupHelper = new ImagePopupHelper(this.olMap, this.layer);

    constructor(
        olMap: OlMap,
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {
        super(
            olMap,
            (targetPosition, transferPoint) => {
                exerciseService.proposeAction(
                    {
                        type: '[TransferPoint] Move TransferPoint',
                        transferPointId: transferPoint.id,
                        targetPosition,
                    },
                    true
                );
            },
            new PointGeometryHelper(),
            600
        );
        this.layer.setStyle((thisFeature, currentZoom) => [
            this.imageStyleHelper.getStyle(
                thisFeature as Feature<Point>,
                currentZoom
            ),
            this.nameStyleHelper.getStyle(
                thisFeature as Feature<Point>,
                currentZoom
            ),
        ]);
    }

    public register(
        destroy$: Subject<void>,
        mapInteractionsManager: OlMapInteractionsManager
    ) {
        super.registerFeatureElementManager(
            this.store.select(selectVisibleTransferPoints),
            destroy$,
            mapInteractionsManager
        );
    }

    private readonly imageStyleHelper = new ImageStyleHelper(
        (feature: Feature) => ({
            url: TransferPoint.image.url,
            height: TransferPoint.image.height,
            aspectRatio: TransferPoint.image.aspectRatio,
        })
    );
    private readonly nameStyleHelper = new NameStyleHelper(
        (feature: Feature) => ({
            name: (this.getElementFromFeature(feature) as TransferPoint)
                .internalName,
            offsetY: 0,
        }),
        0.2,
        'middle'
    );

    public override onFeatureDrop(
        droppedElement: Element | undefined,
        droppedOnFeature: Feature<Point>,
        dropEvent?: TranslateEvent
    ) {
        // TODO: droppedElement isn't necessarily a transfer point -> fix getElementFromFeature typings
        const droppedOnTransferPoint = this.getElementFromFeature(
            droppedOnFeature
        ) as TransferPoint | undefined;
        if (!droppedElement || !droppedOnTransferPoint) {
            console.error('Could not find element for the features');
            return false;
        }
        if (
            droppedElement.type !== 'vehicle' &&
            droppedElement.type !== 'personnel'
        ) {
            return false;
        }

        // Always show the chooseTransferPopup
        // Show a popup to choose the transferPoint or hospital
        this.popupService.openPopup(
            this.popupHelper.getPopupOptions(
                ChooseTransferTargetPopupComponent,
                droppedOnFeature,
                [droppedOnTransferPoint.id, droppedElement.id],
                [],
                [],
                [],
                {
                    transferPointId: droppedOnTransferPoint.id,
                    droppedElementType: droppedElement.type,
                    transferToCallback: (
                        targetId: UUID,
                        targetType: 'hospital' | 'transferPoint'
                    ) => {
                        if (targetType === 'hospital') {
                            this.exerciseService.proposeAction(
                                {
                                    type: '[Hospital] Transport patient to hospital',
                                    hospitalId: targetId,
                                    vehicleId: droppedElement.id,
                                },
                                true
                            );
                            return;
                        }
                        this.exerciseService.proposeAction(
                            {
                                type: '[Transfer] Add to transfer',
                                elementType: droppedElement.type,
                                elementId: droppedElement.id,
                                startPoint: TransferStartPoint.create(
                                    droppedOnTransferPoint.id
                                ),
                                targetTransferPointId: targetId,
                            },
                            true
                        );
                    },
                }
            )
        );
        return true;
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
                TransferPointPopupComponent,
                feature,
                [feature.getId() as UUID],
                [],
                [],
                [],
                {
                    transferPointId: feature.getId() as UUID,
                }
            )
        );
    }

    override isFeatureTranslatable(feature: Feature<Point>): boolean {
        return selectStateSnapshot(selectCurrentRole, this.store) === 'trainer';
    }
}
