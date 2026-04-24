import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { VehicleCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-vehicle-count',
    templateUrl: './radiogram-card-content-vehicle-count.component.html',
    styleUrls: ['./radiogram-card-content-vehicle-count.component.scss'],
    imports: [AsyncPipe, KeyValuePipe],
})
export class RadiogramCardContentVehicleCountComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();
    radiogram$!: Observable<VehicleCountRadiogram>;
    totalVehicleCount$!: Observable<number>;

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<VehicleCountRadiogram>(this.radiogramId())
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
