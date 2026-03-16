import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { currentTransferOf } from 'fuesim-digital-shared';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectVehiclesInTransfer,
    selectPersonnelInTransfer,
    selectExerciseStatus,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { StartPointNameComponent } from '../start-point-name/start-point-name.component';
import { TransferTargetInputComponent } from '../transfer-target-input/transfer-target-input.component';
import { TransferTimeInputComponent } from '../transfer-time-input/transfer-time-input.component';

@Component({
    selector: 'app-transfer-overview-table',
    templateUrl: './transfer-overview-table.component.html',
    styleUrls: ['./transfer-overview-table.component.scss'],
    imports: [
        StartPointNameComponent,
        TransferTargetInputComponent,
        TransferTimeInputComponent,
        AsyncPipe,
    ],
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
