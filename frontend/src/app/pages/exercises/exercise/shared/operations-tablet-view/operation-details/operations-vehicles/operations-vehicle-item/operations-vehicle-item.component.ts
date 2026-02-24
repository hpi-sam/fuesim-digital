import { Component, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle } from 'digital-fuesim-manv-shared';
import { AppState } from 'src/app/state/app.state';
import {
    selectTransferPoints,
    selectAlarmGroups,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-operations-vehicle-item',
    standalone: false,
    templateUrl: './operations-vehicle-item.component.html',
    styleUrl: './operations-vehicle-item.component.scss',
})
export class OperationsVehicleItemComponent {
    public constructor(private readonly store: Store<AppState>) {}

    public vehicle = input.required<Vehicle>();

    public showTransfer = input<boolean>(true);

    public availableTransferPoints$ = this.store.select(selectTransferPoints);
    public availableAlarmGroups$ = this.store.select(selectAlarmGroups);
}
