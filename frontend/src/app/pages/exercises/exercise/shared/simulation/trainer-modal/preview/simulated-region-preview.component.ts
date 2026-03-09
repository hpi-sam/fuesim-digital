import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { createSelector, Store } from '@ngrx/store';
import { Patient, SimulatedRegion } from 'fuesim-digital-shared';
import { combineLatest, Observable, map, Subject, takeUntil } from 'rxjs';
import type {
    Material,
    Personnel,
    UUID,
    Vehicle,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import { groupBy } from 'lodash-es';
import { comparePatientsByVisibleStatus } from '../tabs/compare-patients';
import { PatientWithVisibleStatus } from '../patients-table/simulated-region-overview-patients-table.component';
import type { AppState } from '../../../../../../../state/app.state';
import {
    createSelectSimulatedRegion,
    createSelectElementsInSimulatedRegion,
    selectPatients,
    selectConfiguration,
    selectPersonnel,
    selectVehicles,
    selectVehicleTemplates,
    selectMaterials,
} from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-preview',
    templateUrl: './simulated-region-preview.component.html',
    styleUrls: ['./simulated-region-preview.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewComponent implements OnInit, OnDestroy {
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
    private readonly destroy$ = new Subject<void>();

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

        combineLatest([
            this.patients$,
            vehicles$,
            this.material$,
            this.personnelByCategory$,
        ])
            .pipe(
                map(([patients, vehicles, materials, personnel]) => ({
                    ...patients.map((p) => p.id),
                    ...vehicles.map((v) => v.id),
                    ...materials.map((m) => m.id),
                    ...personnel.map((p) => p.id),
                })),
                takeUntil(this.destroy$)
            )
            .subscribe((ids) => {
                const selection = this.selected();
                if (selection && !ids.includes(selection.id)) {
                    this.selected.set(null);
                }
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
    ngOnDestroy(): void {
        this.destroy$.next();
    }
}
