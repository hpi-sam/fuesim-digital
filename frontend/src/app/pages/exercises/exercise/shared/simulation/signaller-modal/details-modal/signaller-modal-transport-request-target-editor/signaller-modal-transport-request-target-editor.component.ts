import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'digital-fuesim-manv-shared';
import { Observable, map, combineLatest, tap } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import { MessageService } from 'src/app/core/messages/message.service.js';
import { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component.js';
import {
    HotkeyLayer,
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service.js';
import { AppState } from 'src/app/state/app.state.js';
import {
    selectSimulatedRegions,
    createSelectBehaviorState,
} from 'src/app/state/application/selectors/exercise.selectors.js';
import { SignallerModalDetailsService } from '../signaller-modal-details.service.js';

@Component({
    selector: 'app-signaller-modal-transport-request-target-editor',
    templateUrl:
        './signaller-modal-transport-request-target-editor.component.html',
    styleUrl:
        './signaller-modal-transport-request-target-editor.component.scss',
    standalone: false,
})
export class SignallerModalTransportRequestTargetEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    @Input() simulatedRegionId!: UUID;
    @Input() transportBehaviorId!: UUID;

    private hotkeyLayer!: HotkeyLayer;
    submitHotkey = new Hotkey('Enter', false, () => this.updateTarget());

    availableTargets$!: Observable<SearchableDropdownOption[]>;
    currentTargetName$!: Observable<string>;
    selectedTarget: SearchableDropdownOption | null = null;
    loading = false;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly detailsModal: SignallerModalDetailsService,
        private readonly hotkeysService: HotkeysService,
        private readonly messageService: MessageService
    ) {}

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
        this.hotkeyLayer.addHotkey(this.submitHotkey);
    }

    ngOnChanges() {
        const simulatedRegions$ = this.store.select(selectSimulatedRegions);

        const currentTargetId$ = this.store
            .select(
                createSelectBehaviorState(
                    this.simulatedRegionId,
                    this.transportBehaviorId
                )
            )
            .pipe(
                map(
                    (behavior) =>
                        (
                            behavior as ManagePatientTransportToHospitalBehaviorState
                        ).requestTargetId
                )
            );

        this.currentTargetName$ = combineLatest([
            currentTargetId$,
            simulatedRegions$,
        ]).pipe(
            map(([targetId, simulatedRegions]) =>
                targetId
                    ? (simulatedRegions[targetId]?.name ??
                      'unbekannter Einsatzabschnitt')
                    : 'nicht festgelegt'
            )
        );

        this.availableTargets$ = simulatedRegions$.pipe(
            map((simulatedRegions) =>
                Object.values(simulatedRegions).map((simulatedRegion) => ({
                    key: simulatedRegion.id,
                    name: simulatedRegion.name,
                }))
            ),
            map((options) =>
                options.sort((a, b) => a.name.localeCompare(b.name))
            ),
            tap((options) => {
                if (
                    !options.some(
                        (option) => option.key === this.selectedTarget?.key
                    )
                ) {
                    this.selectedTarget = null;
                }
            })
        );
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    selectTarget(selectedTarget: SearchableDropdownOption) {
        this.selectedTarget = selectedTarget;
    }

    updateTarget() {
        if (!this.selectedTarget) return;

        this.exerciseService
            .proposeAction({
                type: '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target',
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: this.transportBehaviorId,
                requestTargetId: this.selectedTarget.key,
            })
            .then((result) => {
                this.loading = false;

                if (result.success) {
                    this.messageService.postMessage({
                        title: 'Befehl erteilt',
                        body: 'Fahrzeuge werden ab nun am eingestellten Zielort angefragt',
                        color: 'success',
                    });
                } else {
                    this.messageService.postError({
                        title: 'Fehler beim Erteilen des Befehls',
                        body: 'Das Ziel für Fahrzeuganfragen konnte nicht geändert werden',
                    });
                }

                this.close();
            });

        this.loading = true;
    }

    close() {
        this.detailsModal.close();
    }
}
