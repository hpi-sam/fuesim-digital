import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { AppState } from 'src/app/state/app.state';
import { selectVehiclesInTransfer } from 'src/app/state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from 'src/app/state/application/selectors/shared.selectors';

@Component({
    selector: 'app-operations-vehicles',
    standalone: false,
    templateUrl: './operations-vehicles.component.html',
    styleUrl: './operations-vehicles.component.scss',
})
export class OperationsVehiclesComponent {
    constructor(private readonly store: Store<AppState>) {}

    public vehiclesAtLocation$ = this.store
        .select(selectVisibleVehicles)
        .pipe(map((vehicles) => Object.values(vehicles)));
    public vehiclesInTransfer$ = this.store
        .select(selectVehiclesInTransfer)
        .pipe(map((vehicles) => Object.values(vehicles)));
}
