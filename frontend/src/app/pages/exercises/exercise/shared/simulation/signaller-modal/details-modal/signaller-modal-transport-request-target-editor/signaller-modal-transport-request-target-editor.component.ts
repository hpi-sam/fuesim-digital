import {
    Component,
    OnChanges,
    OnDestroy,
    OnInit,
    inject,
    input,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import { Observable, map, combineLatest, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { MessageService } from '../../../../../../../../core/messages/message.service';
import {
    SearchableDropdownOption,
    SearchableDropdownComponent,
} from '../../../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    selectSimulatedRegions,
    createSelectBehaviorState,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { AutofocusDirective } from '../../../../../../../../shared/directives/autofocus.directive';
import { HotkeyIndicatorComponent } from '../../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';

@Component({
    selector: 'app-signaller-modal-transport-request-target-editor',
    templateUrl:
        './signaller-modal-transport-request-target-editor.component.html',
    styleUrl:
        './signaller-modal-transport-request-target-editor.component.scss',
    imports: [
        FormsModule,
        NgbPopover,
        AutofocusDirective,
        HotkeyIndicatorComponent,
        SearchableDropdownComponent,
        AsyncPipe,
    ],
})
export class SignallerModalTransportRequestTargetEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly detailsModal = inject(SignallerModalDetailsService);
    private readonly hotkeysService = inject(HotkeysService);
    private readonly messageService = inject(MessageService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly transportBehaviorId = input.required<UUID>();

    private hotkeyLayer!: HotkeyLayer;
    submitHotkey = new Hotkey('Enter', false, () => this.updateTarget());

    availableTargets$!: Observable<SearchableDropdownOption[]>;
    currentTargetName$!: Observable<string>;
    selectedTarget: SearchableDropdownOption | null = null;
    loading = false;

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
        this.hotkeyLayer.addHotkey(this.submitHotkey);
    }

    ngOnChanges() {
        const simulatedRegions$ = this.store.select(selectSimulatedRegions);

        const currentTargetId$ = this.store
            .select(
                createSelectBehaviorState(
                    this.simulatedRegionId(),
                    this.transportBehaviorId()
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
                    ? (simulatedRegions[targetId]?.name ?? 'unbekanntes Ziel')
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
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.transportBehaviorId(),
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
