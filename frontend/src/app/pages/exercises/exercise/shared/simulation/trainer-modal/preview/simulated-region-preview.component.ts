import { Component, inject, OnInit, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { createSelector, Store } from '@ngrx/store';
import { Patient, SimulatedRegion } from 'fuesim-digital-shared';
import { combineLatest, Observable, map } from 'rxjs';
import { AppState } from 'src/app/state/app.state';
import type {
    Material,
    Personnel,
    UUID,
    Vehicle,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import {
    createSelectElementsInSimulatedRegion,
    createSelectSimulatedRegion,
    selectConfiguration,
    selectMaterials,
    selectPatients,
    selectPersonnel,
    selectVehicles,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { groupBy } from 'lodash-es';
import { comparePatientsByVisibleStatus } from '../tabs/compare-patients';
import { PatientWithVisibleStatus } from '../patients-table/simulated-region-overview-patients-table.component';

@Component({
    selector: 'app-simulated-region-preview',
    templateUrl: './simulated-region-preview.component.html',
    styleUrls: ['./simulated-region-preview.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);

    simulatedRegionId: UUID = '';
    selected = signal<Material | Patient | Personnel | Vehicle | null>(null);

    simulatedRegion$!: Observable<SimulatedRegion>;

    patients$!: Observable<PatientWithVisibleStatus[]>;

    material$?: Observable<Material[]>;

    personnelByCategory$!: Observable<Personnel[]>;

    groupedVehicles$!: Observable<
        { vehicleType: string; vehicles: Vehicle[] }[]
    >;

    ngOnInit(): void {
        this.simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId)
        );
        this.patients$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectPatients,
                    this.simulatedRegionId
                ),
                selectConfiguration,
                (patients, configuration) =>
                    patients
                        .sort((patientA, patientB) =>
                            comparePatientsByVisibleStatus(
                                patientA,
                                patientB,
                                configuration
                            )
                        )
                        .map((patient) => ({
                            visibleStatus: Patient.getVisibleStatus(
                                patient,
                                configuration.pretriageEnabled,
                                configuration.bluePatientsEnabled
                            ),
                            ...patient,
                        }))
            )
        );

        this.personnelByCategory$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectPersonnel,
                this.simulatedRegionId
            )
        );

        const vehicles$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectVehicles,
                this.simulatedRegionId
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

        this.material$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectMaterials,
                this.simulatedRegionId
            )
        );
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

    selectElement(element: Material | Patient | Personnel | Vehicle) {
        const currentlySelected = this.selected();
        if (currentlySelected?.id === element.id) {
            this.selected.set(null);
        } else {
            this.selected.set(element);
        }
    }

    public close() {
        this.activeModal.close();
    }
}
