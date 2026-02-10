import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectVehicle } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-available-slots-display',
    templateUrl: './vehicle-available-slots-display.component.html',
    styleUrls: ['./vehicle-available-slots-display.component.scss'],
    standalone: false,
})
export class VehicleAvailableSlotsDisplayComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    @Input()
    vehicleId!: UUID;

    vehicle$!: Observable<Vehicle>;

    ngOnChanges(): void {
        this.vehicle$ = this.store.select(createSelectVehicle(this.vehicleId));
    }
}
