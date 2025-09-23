import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    Material,
    Patient,
    PatientStatus,
    Personnel,
    PersonnelType,
    Vehicle,
} from 'digital-fuesim-manv-shared';
import { SimulatedRegion } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectMaterials,
    selectPatients,
    selectPersonnel,
    selectVehicleTemplates,
    selectVehicles,
    createSelectByPredicate,
} from 'src/app/state/application/selectors/exercise.selectors';

const patientCategories = ['red', 'yellow', 'green', 'black'] as const;
export type PatientCategory = (typeof patientCategories)[number];

const personnelCategories = [
    'notarzt',
    'notSan',
    'rettSan',
    'san',
    'gf',
] as const;
export type PersonnelCategory = (typeof personnelCategories)[number];

@Component({
    selector: 'app-simulated-region-overview-general-tab',
    templateUrl: './simulated-region-overview-general-tab.component.html',
    styleUrls: ['./simulated-region-overview-general-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewGeneralTabComponent implements OnInit {
    @Input() simulatedRegion!: SimulatedRegion;

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public readonly patientCategories = patientCategories;
    public readonly personnelCategories = personnelCategories;

    patients: {
        [Key in `${PatientCategory | 'all'}$`]?: Observable<Patient[]>;
    } = {};

    vehicles$?: Observable<{ [Key in string]?: Vehicle[] }>;

    personnel: {
        [Key in `${PersonnelCategory | 'all'}$`]?: Observable<Personnel[]>;
    } = {};

    material$?: Observable<Material[]>;

    public patientsCollapsed = true;
    public vehiclesCollapsed = true;
    public personnelCollapsed = true;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    ngOnInit(): void {
        const containedPatientsSelector = createSelectElementsInSimulatedRegion(
            selectPatients,
            this.simulatedRegion.id
        );
        const containedPersonnelSelector =
            createSelectElementsInSimulatedRegion(
                selectPersonnel,
                this.simulatedRegion.id
            );

        this.patients.all$ = this.store.select(containedPatientsSelector);
        patientCategories.forEach((category) => {
            this.patients[`${category}$`] = this.store.select(
                createSelectByPredicate(
                    containedPatientsSelector,
                    this.createPatientStatusPredicate(category)
                )
            );
        });

        this.vehicles$ = this.store.select(
            createSelector(
                selectVehicleTemplates,
                createSelectElementsInSimulatedRegion(
                    selectVehicles,
                    this.simulatedRegion.id
                ),
                (vehicleTemplates, vehicles) => {
                    const categorizedVehicles: { [Key in string]?: Vehicle[] } =
                        {};

                    categorizedVehicles['all'] = [];

                    vehicleTemplates.forEach((template) => {
                        categorizedVehicles[template.vehicleType] ??= [];
                    });

                    vehicles.forEach((vehicle) => {
                        categorizedVehicles[vehicle.vehicleType] ??= [];

                        categorizedVehicles[vehicle.vehicleType]!.push(vehicle);

                        categorizedVehicles['all']!.push(vehicle);
                    });

                    return categorizedVehicles;
                }
            )
        );

        this.personnel.all$ = this.store.select(containedPersonnelSelector);
        personnelCategories.forEach((category) => {
            this.personnel[`${category}$`] = this.store.select(
                createSelectByPredicate(
                    containedPersonnelSelector,
                    this.createPersonnelTypePredicate(category)
                )
            );
        });

        this.material$ = this.store.select(
            createSelectElementsInSimulatedRegion(
                selectMaterials,
                this.simulatedRegion.id
            )
        );
    }

    createPatientStatusPredicate(
        status: PatientStatus
    ): (patient: Patient) => boolean {
        return (patient) => patient.realStatus === status;
    }

    createPersonnelTypePredicate(
        type: PersonnelType
    ): (personnel: Personnel) => boolean {
        return (patient) => patient.personnelType === type;
    }

    public async renameSimulatedRegion(newName: string) {
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Rename simulated region',
            simulatedRegionId: this.simulatedRegion.id,
            newName,
        });
    }
}
