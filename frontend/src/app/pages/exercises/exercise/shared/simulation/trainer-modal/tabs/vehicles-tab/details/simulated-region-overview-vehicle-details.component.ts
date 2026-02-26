import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel, Vehicle } from 'fuesim-digital-shared';
import {
    Patient,
    isInSpecificVehicle,
    SimulatedRegion,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import type { PatientWithVisibleStatus } from '../../../patients-table/simulated-region-overview-patients-table.component';
import { StartTransferService } from '../../../start-transfer.service';
import { ExerciseService } from '../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    selectPersonnel,
    selectPatients,
    selectConfiguration,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-vehicle-details',
    templateUrl: './simulated-region-overview-vehicle-details.component.html',
    styleUrls: ['./simulated-region-overview-vehicle-details.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewVehicleDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    readonly startTransferService = inject(StartTransferService);

    readonly simulatedRegion = input.required<SimulatedRegion>();

    readonly vehicle = input<Vehicle>();

    selection$!: Observable<{
        vehicle: Vehicle;
        personnel: (Personnel & { isInVehicle: boolean })[];
        patients: PatientWithVisibleStatus[];
    } | null>;

    ngOnInit() {
        const personnel$ = this.store.select(selectPersonnel);
        const patients$ = this.store.select(selectPatients);
        const configuration$ = this.store.select(selectConfiguration);

        this.selection$ = combineLatest([
            personnel$,
            patients$,
            configuration$,
        ]).pipe(
            map(([personnel, patients, configuration]) => {
                const vehicle = this.vehicle();
                if (!vehicle) return null;
                const vehiclePersonnel = Object.keys(vehicle.personnelIds)
                    .map((id) => personnel[id]!)
                    .map((pers) => ({
                        ...pers,
                        isInVehicle: isInSpecificVehicle(pers, vehicle.id),
                    }));

                const vehiclePatients = Object.keys(vehicle.patientIds)
                    .map((id) => patients[id]!)
                    .map((patient) => ({
                        ...patient,
                        visibleStatus: Patient.getVisibleStatus(
                            patient,
                            configuration.pretriageEnabled,
                            configuration.bluePatientsEnabled
                        ),
                    }));

                return {
                    vehicle,
                    personnel: vehiclePersonnel,
                    patients: vehiclePatients,
                };
            })
        );
    }

    removeVehicle() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove vehicle',
            vehicleId: this.vehicle()!.id,
        });
    }

    moveVehicleToMap() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove from simulated region',
            vehicleId: this.vehicle()!.id,
            simulatedRegionId: this.simulatedRegion().id,
        });
    }

    public initiateVehicleTransfer() {
        this.startTransferService.initiateNewTransferFor({
            vehicleToTransfer: this.vehicle()!,
            patientsToTransfer: this.vehicle()!.patientIds,
        });
    }
}
