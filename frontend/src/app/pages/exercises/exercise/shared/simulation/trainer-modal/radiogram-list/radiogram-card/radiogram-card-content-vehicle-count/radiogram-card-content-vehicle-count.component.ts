import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { VehicleCountRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-vehicle-count',
    templateUrl: './radiogram-card-content-vehicle-count.component.html',
    styleUrls: ['./radiogram-card-content-vehicle-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentVehicleCountComponent implements OnInit {
    @Input() radiogramId!: UUID;
    radiogram$!: Observable<VehicleCountRadiogram>;
    totalVehicleCount$!: Observable<number>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<VehicleCountRadiogram>(this.radiogramId)
        );

        this.totalVehicleCount$ = this.radiogram$.pipe(
            map((radiogram) =>
                Object.values(radiogram.vehicleCount).reduce(
                    (value, item) => value + item,
                    0
                )
            )
        );
    }
}
