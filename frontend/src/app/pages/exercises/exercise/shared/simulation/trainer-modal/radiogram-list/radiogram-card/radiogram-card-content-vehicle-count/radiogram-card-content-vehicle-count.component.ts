import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { VehicleCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-vehicle-count',
    templateUrl: './radiogram-card-content-vehicle-count.component.html',
    styleUrls: ['./radiogram-card-content-vehicle-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentVehicleCountComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() radiogramId!: UUID;
    radiogram$!: Observable<VehicleCountRadiogram>;
    totalVehicleCount$!: Observable<number>;

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
