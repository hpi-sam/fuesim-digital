import type { OnDestroy, OnInit } from '@angular/core';
import { Component, ViewEncapsulation, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { SimulatedRegion, UUID } from 'fuesim-digital-shared';
import { isInSpecificSimulatedRegion } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { Subject, takeUntil } from 'rxjs';
import { SelectPatientService } from '../select-patient.service';
import type { TransferOptions } from '../start-transfer.service';
import { StartTransferService } from '../start-transfer.service';
import type { AppState } from '../../../../../../../state/app.state';
import {
    createSelectSimulatedRegion,
    selectTransferPoints,
} from '../../../../../../../state/application/selectors/exercise.selectors';

type NavIds =
    | 'behaviors'
    | 'general'
    | 'patients'
    | 'transferPoint'
    | 'vehicles';

/**
 * We want to remember the last selected nav item, so the user doesn't have to manually select it again.
 */
let activeNavId: NavIds = 'general';

@Component({
    selector: 'app-simulated-region-overview-general',
    templateUrl: './simulated-region-overview.component.html',
    styleUrls: ['./simulated-region-overview.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class SimulatedRegionOverviewGeneralComponent
    implements OnInit, OnDestroy
{
    private readonly store = inject<Store<AppState>>(Store);
    readonly selectPatientService = inject(SelectPatientService);
    readonly startTransferService = inject(StartTransferService);

    readonly simulatedRegionId = input.required<UUID>();

    simulatedRegion$!: Observable<SimulatedRegion>;

    selectedPatientId!: UUID;

    initialTransferOptions!: TransferOptions;

    public transferPointId$!: Observable<UUID>;

    public get activeNavId() {
        return activeNavId;
    }
    public set activeNavId(value: NavIds) {
        activeNavId = value;
    }

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId())
        );
        this.transferPointId$ = this.store.select(
            createSelector(
                selectTransferPoints,
                (transferPoints) =>
                    Object.values(transferPoints).find((transferPoint) =>
                        isInSpecificSimulatedRegion(
                            transferPoint,
                            this.simulatedRegionId()
                        )
                    )!.id
            )
        );

        this.selectPatientService.patientSelected
            .pipe(takeUntil(this.destroy$))
            .subscribe((newId) => {
                this.selectedPatientId = newId;
                this.activeNavId = 'patients';
            });

        this.startTransferService.transferOptions
            .pipe(takeUntil(this.destroy$))
            .subscribe((transferOptions) => {
                this.initialTransferOptions = transferOptions;
                this.activeNavId = 'behaviors';
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }
}
