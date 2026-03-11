import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, inject, input, viewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import { difference } from 'lodash-es';
import {
    combineLatest,
    map,
    ReplaySubject,
    switchMap,
    type Observable,
} from 'rxjs';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { SearchableDropdownOption } from '../../../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    selectSimulatedRegions,
} from '../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-transport-trays-editor',
    templateUrl: './signaller-modal-transport-trays-editor.component.html',
    styleUrls: ['./signaller-modal-transport-trays-editor.component.scss'],
    standalone: false,
})
export class SignallerModalTransportTraysEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly hotkeysService = inject(HotkeysService);
    private readonly detailsModal = inject(SignallerModalDetailsService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly transportBehaviorId = input.required<UUID>();

    readonly addRegionPopover =
        viewChild.required<NgbPopover>('addRegionPopover');
    readonly removeRegionPopover = viewChild.required<NgbPopover>(
        'removeRegionPopover'
    );

    private readonly inputs$ = new ReplaySubject<{
        simulatedRegionId: UUID;
        transportBehaviorId: UUID;
    }>(1);

    manageTransportBehavior$!: Observable<ManagePatientTransportToHospitalBehaviorState>;
    managedRegions$!: Observable<SearchableDropdownOption[]>;
    unmanagedRegions$!: Observable<SearchableDropdownOption[]>;

    canAdd$!: Observable<boolean>;
    canRemove$!: Observable<boolean>;

    private hotkeyLayer!: HotkeyLayer;
    addRegionHotkey!: Hotkey;
    removeRegionHotkey!: Hotkey;
    finishHotkey = new Hotkey('Enter', false, () => {
        this.close();
    });

    ngOnInit() {
        this.manageTransportBehavior$ = this.inputs$.pipe(
            switchMap(({ simulatedRegionId, transportBehaviorId }) =>
                this.store.select(
                    createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                        simulatedRegionId,
                        transportBehaviorId
                    )
                )
            )
        );

        const allRegions$ = this.store.select(selectSimulatedRegions);

        this.managedRegions$ = combineLatest([
            this.manageTransportBehavior$,
            allRegions$,
        ]).pipe(
            map(([behavior, regions]) =>
                Object.keys(behavior.simulatedRegionsToManage).map((id) => ({
                    key: id,
                    name: regions[id]?.name ?? '',
                }))
            )
        );
        this.unmanagedRegions$ = combineLatest([
            this.managedRegions$,
            allRegions$,
        ]).pipe(
            map(([managedRegions, allRegions]) =>
                difference(
                    Object.keys(allRegions),
                    managedRegions.map((managedRegion) => managedRegion.key)
                ).map((id) => ({
                    key: id,
                    name: allRegions[id]?.name ?? '',
                }))
            )
        );

        this.canAdd$ = this.unmanagedRegions$.pipe(
            map((unmanagedRegions) => unmanagedRegions.length > 0)
        );
        this.canRemove$ = this.managedRegions$.pipe(
            map((managedRegions) => managedRegions.length > 0)
        );

        this.addRegionHotkey = new Hotkey(
            '+',
            false,
            () => {
                this.addRegionPopover().open();
            },
            this.canAdd$
        );
        this.removeRegionHotkey = new Hotkey(
            '-',
            false,
            () => {
                this.removeRegionPopover().open();
            },
            this.canRemove$
        );

        this.hotkeyLayer = this.hotkeysService.createLayer();
        this.hotkeyLayer.addHotkey(this.addRegionHotkey);
        this.hotkeyLayer.addHotkey(this.removeRegionHotkey);
        this.hotkeyLayer.addHotkey(this.finishHotkey);
    }

    ngOnChanges() {
        this.inputs$.next({
            simulatedRegionId: this.simulatedRegionId(),
            transportBehaviorId: this.transportBehaviorId(),
        });
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    public addManagedRegion(selectedRegion: SearchableDropdownOption) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Add Simulated Region To Manage For Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.transportBehaviorId(),
            managedSimulatedRegionId: selectedRegion.key,
        });
    }

    public removeManagedRegion(selectedRegion: SearchableDropdownOption) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.transportBehaviorId(),
            managedSimulatedRegionId: selectedRegion.key,
        });
    }

    close() {
        this.detailsModal.close();
    }
}
