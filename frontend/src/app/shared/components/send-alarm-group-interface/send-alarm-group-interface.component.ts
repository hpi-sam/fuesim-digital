import { computed, type OnDestroy, type OnInit } from '@angular/core';
import { Component, inject, input, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    createVehicleParameters,
    getTransferPointFullName,
    newMapCoordinatesAt,
    StrictObject,
    uuid,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { Subject, map, takeUntil } from 'rxjs';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { NgModel, FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import type { HotkeyLayer } from '../../services/hotkeys.service';
import { Hotkey, HotkeysService } from '../../services/hotkeys.service';
import { ExerciseService } from '../../../core/exercise.service';
import { MessageService } from '../../../core/messages/message.service';
import type { AppState } from '../../../state/app.state';
import {
    selectAlarmGroups,
    selectTransferPoints,
    createSelectAlarmGroup,
    selectVehicleTemplates,
    selectMaterialTemplates,
    selectPersonnelTemplates,
    selectExerciseStatus,
} from '../../../state/application/selectors/exercise.selectors';
import {
    selectCurrentMainRole,
    selectOwnClient,
} from '../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import type { SearchableDropdownOption } from '../searchable-dropdown/searchable-dropdown.component';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { HotkeyIndicatorComponent } from '../hotkey-indicator/hotkey-indicator.component';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { IntegerValidatorDirective } from '../../validation/integer-validator.directive';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component';

// We want to remember this
let selectedAlarmGroup: SearchableDropdownOption | null = null;
let selectedTarget: SearchableDropdownOption | null = null;
let selectedFirstVehiclesTarget: SearchableDropdownOption | null = null;
let firstVehiclesCount = 0;

@Component({
    selector: 'app-send-alarm-group-interface',
    templateUrl: './send-alarm-group-interface.component.html',
    styleUrls: ['./send-alarm-group-interface.component.scss'],
    imports: [
        FormsModule,
        NgbPopover,
        AutofocusDirective,
        HotkeyIndicatorComponent,
        SearchableDropdownComponent,
        IntegerValidatorDirective,
        DisplayValidationComponent,
        AsyncPipe,
    ],
})
export class SendAlarmGroupInterfaceComponent implements OnInit, OnDestroy {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly hotkeysService = inject(HotkeysService);

    readonly useHotkeys = input(true);

    readonly useAlarmGroupButtons = input(false);

    readonly useFirstVehicles = input(true);

    private readonly destroy$ = new Subject<void>();

    readonly selectAlarmGroupPopover = viewChild.required<NgbPopover>(
        'selectAlarmGroupPopover'
    );
    readonly selectTargetPopover = viewChild.required<NgbPopover>(
        'selectTargetPopover'
    );
    readonly selectFirstVehiclesTargetPopover = viewChild.required<NgbPopover>(
        'selectFirstVehiclesTargetPopover'
    );
    readonly firstVehiclesInput = viewChild<NgModel>('firstVehiclesInput');

    private hotkeyLayer!: HotkeyLayer;
    public selectAlarmGroupHotkey = new Hotkey('A', false, () => {
        this.selectAlarmGroupPopover().open();
    });
    public selectTargetHotkey = new Hotkey('Z', false, () => {
        this.selectTargetPopover().open();
    });
    public selectFirstVehiclesTargetHotkey = new Hotkey('⇧ + Z', false, () => {
        this.selectFirstVehiclesTargetPopover().open();
    });
    public submitHotkey = new Hotkey('Enter', false, () => {
        this.sendAlarmGroup();
    });

    public currentRole = this.store.selectSignal(selectCurrentMainRole);
    public exerciseStatus = this.store.selectSignal(selectExerciseStatus);
    public readonly interfaceDisabled = computed(
        () =>
            this.currentRole() !== 'trainer' &&
            this.exerciseStatus() !== 'running'
    );

    public loading = false;

    public readonly alarmGroups$ = this.store.select(selectAlarmGroups);

    public readonly alarmGroupsDropdownOptions$: Observable<
        SearchableDropdownOption[]
    > = this.store.select(selectAlarmGroups).pipe(
        map((alarmGroups) =>
            Object.values(alarmGroups)
                .map((alarmGroup) => {
                    const dropdownOption: SearchableDropdownOption = {
                        key: alarmGroup.id,
                        name: alarmGroup.name,
                    };

                    if (alarmGroup.triggerCount > 0) {
                        dropdownOption.name += ' (bereits alarmiert)';
                        dropdownOption.color = '#bbbbbb';
                    }

                    return dropdownOption;
                })
                .sort((a, b) => a.name.localeCompare(b.name))
        )
    );

    public readonly transferPoints$: Observable<SearchableDropdownOption[]> =
        this.store.select(selectTransferPoints).pipe(
            map((transferPoints) =>
                Object.values(transferPoints)
                    .map((transferPoint) => ({
                        key: transferPoint.id,
                        name: getTransferPointFullName(transferPoint),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
        );

    public get selectedAlarmGroupOption() {
        return selectedAlarmGroup;
    }
    public set selectedAlarmGroupOption(
        value: SearchableDropdownOption | null
    ) {
        selectedAlarmGroup = value;
    }

    public get selectedTarget() {
        return selectedTarget;
    }
    public set selectedTarget(value: SearchableDropdownOption | null) {
        selectedTarget = value;
    }

    public get selectedFirstVehiclesTarget() {
        return selectedFirstVehiclesTarget;
    }
    public set selectedFirstVehiclesTarget(
        value: SearchableDropdownOption | null
    ) {
        selectedFirstVehiclesTarget = value;
    }

    public get firstVehiclesCount() {
        return firstVehiclesCount;
    }
    public set firstVehiclesCount(value: number) {
        firstVehiclesCount = value;
    }

    public get canSubmit() {
        return (
            !(this.firstVehiclesInput()?.invalid ?? false) &&
            selectedAlarmGroup !== null &&
            selectedTarget !== null &&
            (firstVehiclesCount === 0 || selectedFirstVehiclesTarget !== null)
        );
    }

    constructor() {
        // reset chosen targetTransferPoint if it gets deleted
        this.transferPoints$
            .pipe(takeUntil(this.destroy$))
            .subscribe((transferPoints) => {
                if (
                    this.selectedTarget?.key &&
                    !transferPoints.some(
                        (transferPoint) =>
                            transferPoint.key === this.selectedTarget?.key
                    )
                ) {
                    this.selectedTarget = null;
                }
            });
    }

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
        if (this.useHotkeys()) {
            this.hotkeyLayer.addHotkey(this.selectAlarmGroupHotkey);
            this.hotkeyLayer.addHotkey(this.selectTargetHotkey);
            this.hotkeyLayer.addHotkey(this.selectFirstVehiclesTargetHotkey);
            this.hotkeyLayer.addHotkey(this.submitHotkey);
        }
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
        this.destroy$.next();
    }

    public async sendAlarmGroup() {
        this.loading = true;

        if (!this.canSubmit) {
            this.messageService.postError({
                title: 'Fehler beim Senden der Alarmgruppe',
                body: 'Bitte geben Sie alle notwendigen Informationen an!',
            });
            this.loading = false;
            return;
        }

        const alarmGroup = selectStateSnapshot(
            createSelectAlarmGroup(selectedAlarmGroup!.key),
            this.store
        );

        const firstVehiclesCountForAction = this.firstVehiclesCount;
        const firstVehiclesCountReducedBy = Math.min(
            Object.keys(alarmGroup.alarmGroupVehicles).length,
            this.firstVehiclesCount
        );
        this.firstVehiclesCount -= firstVehiclesCountReducedBy;

        const vehicleTemplates = selectStateSnapshot(
            selectVehicleTemplates,
            this.store
        );

        const materialTemplates = selectStateSnapshot(
            selectMaterialTemplates,
            this.store
        );
        const personnelTemplates = selectStateSnapshot(
            selectPersonnelTemplates,
            this.store
        );

        const sortedAlarmGroupVehicles = StrictObject.values(
            alarmGroup.alarmGroupVehicles
        ).sort((a, b) => a.time - b.time);

        // We have to provide a map position when creating a vehicle
        // It will be overwritten directly after by putting the vehicle into transfer
        const placeholderPosition = newMapCoordinatesAt(0, 0);

        // Create vehicle parameters for the alarm group
        // This has to be done in the frontend to ensure the UUIDs of the vehicles, material, and personnel are consistent across all clients
        const vehicleParameters = sortedAlarmGroupVehicles.map(
            (alarmGroupVehicle) =>
                createVehicleParameters(
                    uuid(),
                    {
                        ...vehicleTemplates[
                            alarmGroupVehicle.vehicleTemplateId
                        ]!,
                        name: alarmGroupVehicle.name,
                    },
                    materialTemplates,
                    personnelTemplates,
                    placeholderPosition
                )
        );

        const request = await this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Send Alarm Group',
            clientName: selectStateSnapshot(selectOwnClient, this.store)!.name,
            alarmGroupId: alarmGroup.id,
            sortedVehicleParameters: vehicleParameters,
            targetTransferPointId: this.selectedTarget!.key,
            firstVehiclesCount: firstVehiclesCountForAction,
            firstVehiclesTargetTransferPointId:
                this.selectedFirstVehiclesTarget?.key,
        });

        this.loading = false;

        if (request.success) {
            this.messageService.postMessage({
                title: `Alarmgruppe ${alarmGroup.name} alarmiert!`,
                color: 'success',
            });
        } else {
            this.firstVehiclesCount += firstVehiclesCountReducedBy;
            this.messageService.postError({
                title: 'Fehler beim Senden der Alarmgruppe',
                body: 'Die Alarmgruppe konnte nicht gesendet werden',
            });
        }
    }
}
