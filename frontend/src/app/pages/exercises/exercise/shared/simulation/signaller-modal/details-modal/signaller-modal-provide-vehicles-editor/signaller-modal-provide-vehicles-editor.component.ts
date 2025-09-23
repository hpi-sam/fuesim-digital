import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, Input, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ResourceDescription } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import {
    TransferPoint,
    isInSpecificSimulatedRegion,
    isUnoccupiedImmutable,
} from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import { combineLatest, map, tap, type Observable } from 'rxjs';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import {
    selectCurrentTime,
    selectTransferPoints,
    selectVehicleTemplates,
    selectVehicles,
} from 'src/app/state/application/selectors/exercise.selectors';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from 'src/app/core/messages/message.service';
import { groupBy } from 'lodash-es';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';

@Component({
    selector: 'app-signaller-modal-provide-vehicles-editor',
    templateUrl: './signaller-modal-provide-vehicles-editor.component.html',
    styleUrls: ['./signaller-modal-provide-vehicles-editor.component.scss'],
    standalone: false,
})
export class SignallerModalProvideVehiclesEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    @Input() simulatedRegionId!: UUID;
    @Input() transferBehaviorId!: UUID;

    @ViewChild('selectVehiclePopover')
    selectVehiclePopover!: NgbPopover;
    @ViewChild('selectTargetPopover')
    selectTargetPopover!: NgbPopover;

    public get canSend() {
        return (
            this.selectedTarget !== null &&
            Object.values(this.vehicleAmounts).every((amount) => amount >= 0)
        );
    }

    private hotkeyLayer!: HotkeyLayer;
    selectTargetHotkey = new Hotkey('Z', false, () =>
        this.selectTargetPopover.open()
    );
    submitHotkey = new Hotkey('Enter', false, () => this.startTransfer());

    vehicleTemplates$ = this.store.select(selectVehicleTemplates);
    vehicleAmounts: ResourceDescription = {};

    availableVehicles$!: Observable<ResourceDescription>;

    availableTargets$!: Observable<SearchableDropdownOption[]>;
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
                            this.simulatedRegionId
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
                            this.simulatedRegionId
                        )
                )
            ),
            map((transferPoints) =>
                transferPoints.map((transferPoint) => ({
                    key: transferPoint.id,
                    name: TransferPoint.getFullName(transferPoint),
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
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: this.transferBehaviorId,
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
                        body: 'Der Fahrzeug-Befehl ist nicht bei der simulierten Abschnittsleitung angekommen',
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
