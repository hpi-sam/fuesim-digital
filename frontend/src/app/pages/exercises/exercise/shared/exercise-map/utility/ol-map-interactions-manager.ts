import type VectorLayer from 'ol/layer/Vector';
import type { Interaction } from 'ol/interaction';
import { defaults as defaultInteractions } from 'ol/interaction';
import type { Subject } from 'rxjs';
import { combineLatest, takeUntil } from 'rxjs';
import type { Feature } from 'ol';
import { Collection } from 'ol';
import type OlMap from 'ol/Map';
import type { Store } from '@ngrx/store';
import type { ExerciseStatus, Role, UUID } from 'fuesim-digital-shared';
import type { TranslateEvent } from 'ol/interaction/Translate';
import type { Pixel } from 'ol/pixel';
import { featureElementKey } from '../feature-managers/element-manager';
import type { AppState } from '../../../../../../state/app.state';
import { selectExerciseStateMode } from '../../../../../../state/application/selectors/application.selectors';
import { selectExerciseStatus } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type { FeatureManager } from './feature-manager';
import type { PopupManager } from './popup-manager';
import { TranslateInteraction } from './translate-interaction';
import type { PopupService } from './popup.service';

export class OlMapInteractionsManager {
    private readonly featureLayers: VectorLayer[] = [];
    private readonly trainerInteractions: Interaction[] = [];
    private translateInteraction: TranslateInteraction =
        new TranslateInteraction();
    private participantInteractions: Interaction[] = [];
    private interactions: Collection<Interaction> =
        new Collection<Interaction>();
    private lastStatus: ExerciseStatus | undefined;
    private lastRole: Role | undefined;
    private lastExerciseStateMode: 'exercise' | 'timeTravel' | undefined;

    constructor(
        private readonly mapInteractions: Collection<Interaction>,
        private readonly store: Store<AppState>,
        private readonly popupManager: PopupManager,
        private readonly popupService: PopupService,
        private readonly olMap: OlMap,
        private readonly layerFeatureManagerDictionary: Map<
            VectorLayer,
            FeatureManager<any>
        >,
        private readonly destroy$: Subject<void>
    ) {
        this.updateInteractions();
        this.registerInteractionEnablementHandler();
    }

    public addFeatureLayer(layer: VectorLayer) {
        this.featureLayers.push(layer);
        this.syncInteractionsAndHandler();
    }

    public addTrainerInteraction(interaction: Interaction) {
        this.trainerInteractions.push(interaction);
        this.syncInteractionsAndHandler();
    }

    private syncInteractionsAndHandler() {
        this.updateInteractions();
        this.registerDropHandler();
        this.applyInteractions();
        this.updateInteractionEnablement(
            this.lastStatus,
            this.lastRole,
            this.lastExerciseStateMode
        );
    }

    private updateTranslateInteraction() {
        this.translateInteraction = new TranslateInteraction({
            layers: this.featureLayers,
            hitTolerance: 10,
            filter: (feature, layer) => {
                const featureManager = this.layerFeatureManagerDictionary.get(
                    layer as VectorLayer
                );
                return featureManager === undefined
                    ? false
                    : featureManager.isFeatureTranslatable(feature);
            },
        });
    }

    private updateParticipantInteractions() {
        this.participantInteractions = [this.translateInteraction];
    }

    private updateInteractions() {
        this.updateTranslateInteraction();
        this.updateParticipantInteractions();
        this.interactions = defaultInteractions({
            pinchRotate: false,
            altShiftDragRotate: false,
            keyboard: true,
        }).extend(
            selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer'
                ? [...this.participantInteractions, ...this.trainerInteractions]
                : [...this.participantInteractions]
        );
    }

    private applyInteractions() {
        this.mapInteractions.clear();
        // We just want to modify this for the Map not do anything with it after so we ignore the returned value
        // eslint-disable-next-line rxjs-x/no-floating-observables
        this.mapInteractions.extend(this.interactions.getArray());
    }

    // Register handlers that disable or enable certain interactions
    private registerInteractionEnablementHandler() {
        combineLatest([
            this.store.select(selectExerciseStatus),
            this.store.select(selectCurrentMainRole),
            this.store.select(selectExerciseStateMode),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([status, currentRole, exerciseStateMode]) => {
                this.updateInteractionEnablement(
                    status,
                    currentRole,
                    exerciseStateMode
                );
            });
    }

    // this shows a paused overlay and disables interactions for participants when the exercise is paused
    private updateInteractionEnablement(
        status: ExerciseStatus | undefined,
        currentRole: Role | undefined,
        exerciseStateMode: 'exercise' | 'timeTravel' | undefined
    ) {
        this.lastRole = currentRole;
        this.lastStatus = status;
        this.lastExerciseStateMode = exerciseStateMode;
        const isPausedAndParticipant =
            status !== 'running' && currentRole === 'participant';
        const areInteractionsActive =
            !isPausedAndParticipant && exerciseStateMode !== 'timeTravel';
        this.participantInteractions.forEach((interaction) => {
            interaction.setActive(areInteractionsActive);
        });
        this.popupManager.setPopupsEnabled(!isPausedAndParticipant);
        this.getOlViewportElement().style.filter = isPausedAndParticipant
            ? 'brightness(50%)'
            : '';
    }

    private registerDropHandler() {
        this.translateInteraction.on('translateend', (event) => {
            const pixel = this.olMap.getPixelFromCoordinate(event.coordinate);
            const droppedFeature: Feature = event.features.getArray()[0]!;
            this.handleTranslateEnd(pixel, droppedFeature, event);
        });
    }

    private handleTranslateEnd(
        pixel: Pixel,
        droppedFeature: Feature,
        event: TranslateEvent
    ) {
        if (
            droppedFeature.getId() !== undefined &&
            this.popupManager.currentClosingIds.includes(
                droppedFeature.getId() as UUID
            )
        ) {
            this.popupService.dismissPopup();
        }

        this.olMap.forEachFeatureAtPixel(pixel, (droppedOnFeature, layer) => {
            // Skip layer when unset
            // OpenLayers type definitions are incorrect, layer may be `null`
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (layer === null) {
                return;
            }

            // Do not drop a feature on itself
            if (droppedFeature === droppedOnFeature) {
                return;
            }

            // We stop propagating the event as soon as the onFeatureDropped function returns true
            return this.layerFeatureManagerDictionary
                .get(layer as VectorLayer)!
                .onFeatureDrop(
                    this.getElementFromFeature(droppedFeature),
                    droppedOnFeature as Feature,
                    event
                );
        });
    }

    private getOlViewportElement(): HTMLElement {
        return this.olMap
            .getTargetElement()
            .querySelectorAll('.ol-viewport')[0] as HTMLElement;
    }

    private getElementFromFeature(feature: Feature<any>) {
        return feature.get(featureElementKey);
    }
}
