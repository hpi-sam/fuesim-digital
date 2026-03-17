import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Vehicle } from 'fuesim-digital-shared';
import { AsyncPipe } from '@angular/common';
import {
    selectTransferPoints,
    selectAlarmGroups,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../../../../state/app.state';

@Component({
    selector: 'app-operations-vehicle-item',
    templateUrl: './operations-vehicle-item.component.html',
    styleUrl: './operations-vehicle-item.component.scss',
    imports: [AsyncPipe],
})
export class OperationsVehicleItemComponent {
    private readonly store = inject(Store<AppState>);

    public readonly vehicle = input.required<Vehicle>();

    public readonly showTransfer = input<boolean>(true);

    public availableTransferPoints$ = this.store.select(selectTransferPoints);
    public availableAlarmGroups$ = this.store.select(selectAlarmGroups);
}
