import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    Personnel,
    UUID,
    Vehicle,
    VehicleTemplate,
} from 'digital-fuesim-manv-shared';
import {
    Patient,
    isInSpecificVehicle,
    SimulatedRegion,
} from 'digital-fuesim-manv-shared';
import { groupBy } from 'lodash-es';
import type { Observable } from 'rxjs';
import { combineLatest, map, Subject } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectConfiguration,
    selectPatients,
    selectPersonnel,
    selectVehicleTemplates,
    selectVehicles,
} from 'src/app/state/application/selectors/exercise.selectors';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { PatientWithVisibleStatus } from '../../patients-table/simulated-region-overview-patients-table.component';
import { StartTransferService } from '../../start-transfer.service';

@Component({
    selector: 'app-simulated-region-overview-vehicles-tab',
    templateUrl: './simulated-region-overview-vehicles-tab.component.html',
    styleUrls: ['./simulated-region-overview-vehicles-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewVehiclesTabComponent implements OnInit {
    @Input()
    simulatedRegion!: SimulatedRegion;

    selectedVehicleId$ = new Subject<UUID | null>();
    selection$!: Observable<{
        vehicle: Vehicle;
        personnel: (Personnel & { isInVehicle: boolean })[];
        patients: PatientWithVisibleStatus[];
    } | null>;
    selectedVehiclePersonnel$!: Observable<Personnel[]>;

    groupedVehicles$!: Observable<
        { vehicleType: string; vehicles: Vehicle[] }[]
    >;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        readonly startTransferService: StartTransferService
    ) {}

    ngOnInit() {
        this.selectedVehicleId$.next(null);

        const vehicles$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectVehicles,
                this.simulatedRegion.id
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
                            this.indexOfTemplate(vehicleTemplates, keyA) -
                            this.indexOfTemplate(vehicleTemplates, keyB)
                    )
                    .map(([key, values]) => ({
                        vehicleType: key,
                        vehicles: values.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        ),
                    }));
            })
        );

        const personnel$ = this.store.select(selectPersonnel);
        const patients$ = this.store.select(selectPatients);
        const configuration$ = this.store.select(selectConfiguration);

        this.selection$ = combineLatest([
            vehicles$,
            personnel$,
            patients$,
            configuration$,
            this.selectedVehicleId$,
        ]).pipe(
            map(
                ([
                    vehicles,
                    personnel,
                    patients,
                    configuration,
                    selectedId,
                ]) => {
                    const selectedVehicle = vehicles.find(
                        (vehicle) => vehicle.id === selectedId
                    );

                    if (!selectedVehicle) return null;

                    const vehiclePersonnel = Object.keys(
                        selectedVehicle.personnelIds
                    )
                        .map((id) => personnel[id]!)
                        .map((pers) => ({
                            ...pers,
                            isInVehicle: isInSpecificVehicle(pers, selectedId!),
                        }));

                    const vehiclePatients = Object.keys(
                        selectedVehicle.patientIds
                    )
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
                        vehicle: selectedVehicle,
                        personnel: vehiclePersonnel,
                        patients: vehiclePatients,
                    };
                }
            )
        );
    }

    selectVehicle(vehicleId: UUID) {
        this.selectedVehicleId$.next(vehicleId);
    }

    removeVehicle(vehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove vehicle',
            vehicleId,
        });
    }

    moveVehicleToMap(vehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove from simulated region',
            vehicleId,
            simulatedRegionId: this.simulatedRegion.id,
        });
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

    public initiateVehicleTransfer(vehicle: Vehicle) {
        this.startTransferService.initiateNewTransferFor({
            vehicleToTransfer: vehicle,
            patientsToTransfer: vehicle.patientIds,
        });
    }
}
