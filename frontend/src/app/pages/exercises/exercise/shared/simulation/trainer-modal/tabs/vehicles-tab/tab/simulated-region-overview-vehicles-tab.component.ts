import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, VehicleTemplate } from 'fuesim-digital-shared';
import { SimulatedRegion } from 'fuesim-digital-shared';
import { groupBy } from 'lodash-es';
import type { Observable } from 'rxjs';
import { combineLatest, map, Subject } from 'rxjs';
import { StartTransferService } from '../../../start-transfer.service';
import { ExerciseService } from '../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectVehicles,
    selectVehicleTemplates,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-vehicles-tab',
    templateUrl: './simulated-region-overview-vehicles-tab.component.html',
    styleUrls: ['./simulated-region-overview-vehicles-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewVehiclesTabComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    readonly startTransferService = inject(StartTransferService);

    readonly simulatedRegion = input.required<SimulatedRegion>();

    selectedVehicle$ = new Subject<Vehicle | null>();

    groupedVehicles$!: Observable<
        { vehicleType: string; vehicles: Vehicle[] }[]
    >;

    ngOnInit() {
        this.selectedVehicle$.next(null);

        const vehicles$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectVehicles,
                this.simulatedRegion().id
            )
        );

        const vehicleTemplates$ = this.store.select(selectVehicleTemplates);

        this.groupedVehicles$ = combineLatest([
            vehicles$,
            vehicleTemplates$,
        ]).pipe(
            map(([vehicles, vehicleTemplates]) => {
                const groupedVehicles = groupBy(
                    vehicles,
                    (vehicle) => vehicle.vehicleType
                );

                return Object.entries(groupedVehicles)
                    .sort(
                        ([keyA], [keyB]) =>
                            this.indexOfTemplate(
                                Object.values(vehicleTemplates),
                                keyA
                            ) -
                            this.indexOfTemplate(
                                Object.values(vehicleTemplates),
                                keyB
                            )
                    )
                    .map(([key, values]) => ({
                        vehicleType: key,
                        vehicles: values.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        ),
                    }));
            })
        );
    }

    selectVehicle(vehicle: Vehicle) {
        this.selectedVehicle$.next(vehicle);
    }

    private indexOfTemplate(
        vehicleTemplates: readonly VehicleTemplate[],
        vehicleType: string
    ): number {
        const index = vehicleTemplates.findIndex(
            (template) => template.vehicleType === vehicleType
        );
        return index === -1 ? vehicleTemplates.length : index;
    }
}
