import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, inject, input, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ResourceDescription, UUID } from 'fuesim-digital-shared';
import {
    getTransferPointFullName,
    isInSpecificSimulatedRegion,
    isUnoccupiedImmutable,
} from 'fuesim-digital-shared';
import { groupBy } from 'lodash-es';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import type { Observable } from 'rxjs';
import { combineLatest, map, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
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
    selectVehicleTemplates,
    selectVehicles,
    selectCurrentTime,
    selectTransferPoints,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { IntegerValidatorDirective } from '../../../../../../../../shared/validation/integer-validator.directive';
import { DisplayValidationComponent } from '../../../../../../../../shared/validation/display-validation/display-validation.component';
import { HotkeyIndicatorComponent } from '../../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';
import { ValuesPipe } from '../../../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-signaller-modal-provide-vehicles-editor',
    templateUrl: './signaller-modal-provide-vehicles-editor.component.html',
    styleUrls: ['./signaller-modal-provide-vehicles-editor.component.scss'],
    imports: [
        FormsModule,
        IntegerValidatorDirective,
        DisplayValidationComponent,
        NgbPopover,
        HotkeyIndicatorComponent,
        SearchableDropdownComponent,
        ValuesPipe,
        AsyncPipe,
    ],
})
export class SignallerModalProvideVehiclesEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly detailsModal = inject(SignallerModalDetailsService);
    private readonly hotkeysService = inject(HotkeysService);
    private readonly messageService = inject(MessageService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly transferBehaviorId = input.required<UUID>();

    readonly selectTargetPopover = viewChild.required<NgbPopover>(
        'selectTargetPopover'
    );

    public get canSend() {
        return (
            this.selectedTarget !== null &&
            Object.values(this.vehicleAmounts).every((amount) => amount >= 0)
        );
    }

    private hotkeyLayer!: HotkeyLayer;
    selectTargetHotkey = new Hotkey('Z', false, () =>
        this.selectTargetPopover().open()
    );
    submitHotkey = new Hotkey('Enter', false, () => this.startTransfer());

    vehicleTemplates$ = this.store.select(selectVehicleTemplates);
    vehicleAmounts: ResourceDescription = {};

    availableVehicles$!: Observable<ResourceDescription>;

    availableTargets$!: Observable<SearchableDropdownOption[]>;
    selectedTarget: SearchableDropdownOption | null = null;

    loading = false;

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
        this.hotkeyLayer.addHotkey(this.selectTargetHotkey);
        this.hotkeyLayer.addHotkey(this.submitHotkey);
    }

    ngOnChanges() {
        const vehicles$ = this.store.select(selectVehicles);
        const currentTime$ = this.store.select(selectCurrentTime);

        this.availableVehicles$ = combineLatest([vehicles$, currentTime$]).pipe(
            map(([vehicles, currentTime]) =>
                Object.values(vehicles).filter(
                    (vehicle) =>
                        isInSpecificSimulatedRegion(
                            vehicle,
                            this.simulatedRegionId()
                        ) && isUnoccupiedImmutable(vehicle, currentTime)
                )
            ),
            map((vehicles) =>
                groupBy(vehicles, (vehicle) => vehicle.vehicleType)
            ),
            map((groupedVehicles) =>
                Object.fromEntries(
                    Object.entries(groupedVehicles).map(
                        ([vehicleType, vehicles]) => [
                            vehicleType,
                            vehicles.length,
                        ]
                    )
                )
            )
        );

        this.availableTargets$ = this.store.select(selectTransferPoints).pipe(
            map((transferPoints) =>
                Object.values(transferPoints).filter(
                    (transferPoint) =>
                        !isInSpecificSimulatedRegion(
                            transferPoint,
                            this.simulatedRegionId()
                        )
                )
            ),
            map((transferPoints) =>
                transferPoints.map((transferPoint) => ({
                    key: transferPoint.id,
                    name: getTransferPointFullName(transferPoint),
                }))
            ),
            map((options) => this.sortOptions(options)),
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

    private sortOptions(options: SearchableDropdownOption[]) {
        return options.sort((a, b) => a.name.localeCompare(b.name));
    }

    increaseAmount(vehicleType: string) {
        this.vehicleAmounts[vehicleType] ??= 0;

        this.vehicleAmounts[vehicleType]++;
    }

    decreaseAmount(vehicleType: string) {
        this.vehicleAmounts[vehicleType] ??= 0;

        this.vehicleAmounts[vehicleType]--;

        if (this.vehicleAmounts[vehicleType] < 0) {
            this.vehicleAmounts[vehicleType] = 0;
        }
    }

    selectTarget(selectedTarget: SearchableDropdownOption) {
        this.selectedTarget = selectedTarget;
    }

    startTransfer() {
        if (!this.canSend) return;

        this.exerciseService
            .proposeAction({
                type: '[TransferBehavior] Transfer Vehicles',
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.transferBehaviorId(),
                requestedVehicles: this.vehicleAmounts,
                destinationType: 'transferPoint',
                destinationId: this.selectedTarget!.key,
            })
            .then((result) => {
                this.loading = false;

                if (result.success) {
                    this.messageService.postMessage({
                        title: 'Befehl erteilt',
                        body: 'Die Fahrzeuge werden in Kürze entsendet',
                        color: 'success',
                    });
                } else {
                    this.messageService.postError({
                        title: 'Fehler beim Erteilen des Befehls',
                        body: 'Der Fahrzeug-Befehl ist nicht bei der Leitung des simulierten Bereichs angekommen',
                    });
                }

                this.detailsModal.close();
            });

        this.loading = true;
    }

    close() {
        this.detailsModal.close();
    }
}
