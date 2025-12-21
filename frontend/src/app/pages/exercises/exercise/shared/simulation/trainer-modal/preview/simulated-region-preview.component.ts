import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { createSelector, Store } from '@ngrx/store';
import {
    isInSpecificVehicle,
    Patient,
    SimulatedRegion,
} from 'digital-fuesim-manv-shared';
import { combineLatest, Observable, Subject, map } from 'rxjs';
import { AppState } from 'src/app/state/app.state';
import type {
    CanCaterFor,
    Material,
    PatientStatus,
    Personnel,
    UUID,
    Vehicle,
    VehicleTemplate,
} from 'digital-fuesim-manv-shared';
import {
    createSelectElementsInSimulatedRegion,
    createSelectMaterial,
    createSelectPersonnel,
    createSelectSimulatedRegion,
    selectConfiguration,
    selectMaterials,
    selectPatients,
    selectPersonnel,
    selectVehicles,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { groupBy } from 'lodash-es';
import { ExerciseService } from 'src/app/core/exercise.service';
import { comparePatientsByVisibleStatus } from '../tabs/compare-patients';
import { PatientWithVisibleStatus } from '../patients-table/simulated-region-overview-patients-table.component';
import { StartTransferService } from '../start-transfer.service';
const selectionCategories = [
    'patient',
    'personnel',
    'vehicle',
    'material',
] as const;
export type selectionCategory = (typeof selectionCategories)[number];
@Component({
    selector: 'app-simulated-region-preview',
    templateUrl: './simulated-region-preview.component.html',
    styleUrls: ['./simulated-region-preview.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewComponent implements OnInit {
    @Input() simulatedRegionId!: UUID;
    @Input() selectedId?: UUID;

    selectedVehicleId$ = new Subject<UUID | null>();
    selectedVehiclePersonnel$!: Observable<Personnel[]>;

    selectionCategory?: selectionCategory;

    simulatetRegion$!: Observable<SimulatedRegion>;

    patients$!: Observable<PatientWithVisibleStatus[]>;

    material$?: Observable<Material[]>;
    selectedMaterial$?: Observable<Material>;

    personnelByCategory$!: Observable<Personnel[]>;
    selectedPersonnel$!: Observable<Personnel>;
    caterForStatuses: (PatientStatus & keyof CanCaterFor)[] = [
        'red',
        'yellow',
        'green',
    ];

    vehicleSelection$!: Observable<{
        vehicle: Vehicle;
        personnel: (Personnel & { isInVehicle: boolean })[];
        patients: PatientWithVisibleStatus[];
    } | null>;

    groupedVehicles$!: Observable<
        { vehicleType: string; vehicles: Vehicle[] }[]
    >;

    detailsIsCollapsed = true;
    collapseIsLocked = false;
    detailsWidth = 1;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        readonly startTransferService: StartTransferService,
        public readonly activeModal: NgbActiveModal
    ) {}

    ngOnInit(): void {
        this.simulatetRegion$ = this.store.select(
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

        const personnel$ = this.store.select(selectPersonnel);

        this.selectedVehicleId$.next(null);

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

        const patientsUnorderd$ = this.store.select(selectPatients);
        const configuration$ = this.store.select(selectConfiguration);

        this.vehicleSelection$ = combineLatest([
            vehicles$,
            personnel$,
            patientsUnorderd$,
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
        this.material$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectMaterials,
                this.simulatedRegionId
            )
        );
    }

    selectVehicle(vehicleId: UUID) {
        this.selectedVehicleId$.next(vehicleId);
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

    removeVehicle(vehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove vehicle',
            vehicleId,
        });
    }

    selectingPersonnel(personnelId: UUID) {
        this.selectedPersonnel$ = this.store.select(
            createSelectPersonnel(personnelId)
        );
    }

    selectingMaterial(materialId: UUID) {
        this.selectedMaterial$ = this.store.select(
            createSelectMaterial(materialId)
        );
    }

    moveVehicleToMap(vehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Remove from simulated region',
            vehicleId,
            simulatedRegionId: this.simulatedRegionId,
        });
    }

    public initiateVehicleTransfer(vehicle: Vehicle) {
        this.startTransferService.initiateNewTransferFor({
            vehicleToTransfer: vehicle,
            patientsToTransfer: vehicle.patientIds,
        });
    }

    public close() {
        this.activeModal.close();
    }
}
