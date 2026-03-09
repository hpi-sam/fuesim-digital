import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { currentTransferOf } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectVehiclesInTransfer,
    selectPersonnelInTransfer,
    selectExerciseStatus,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-overview-table',
    templateUrl: './transfer-overview-table.component.html',
    styleUrls: ['./transfer-overview-table.component.scss'],
    standalone: false,
})
export class TransferOverviewTableComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly vehiclesInTransfer$ = this.store.select(
        selectVehiclesInTransfer
    );
    public readonly personnelInTransfer$ = this.store.select(
        selectPersonnelInTransfer
    );

    public currentTransferOf = currentTransferOf;

    public readonly exerciseStatus$ = this.store.select(selectExerciseStatus);
}
