import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    Material,
    Patient,
    PatientStatus,
    Personnel,
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
    selectPersonnelTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';

const patientCategories = ['red', 'yellow', 'green', 'black'] as const;
export type PatientCategory = (typeof patientCategories)[number];

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
    public readonly personnelTemplates$ = this.store.select(
        selectPersonnelTemplates
    );

    public readonly patientCategories = patientCategories;

    patients: {
        [Key in `${PatientCategory | 'all'}$`]?: Observable<Patient[]>;
    } = {};

    vehicles$?: Observable<{ [Key in string]?: Vehicle[] }>;

    personnel$?: Observable<{ [Key in string]?: Personnel[] }>;

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

        this.personnel$ = this.store.select(
            createSelector(
                selectPersonnelTemplates,
                createSelectElementsInSimulatedRegion(
                    selectPersonnel,
                    this.simulatedRegion.id
                ),
                (personnelTemplates, personnel) => {
                    const categorizedPersonnel: {
                        [Key in string]?: Personnel[];
                    } = {};

                    categorizedPersonnel['all'] = [];

                    personnelTemplates.forEach((template) => {
                        categorizedPersonnel[template.id] ??= [];
                    });

                    personnel.forEach((singlePersonnel) => {
                        categorizedPersonnel[singlePersonnel.baseTemplateId] ??=
                            [];

                        categorizedPersonnel[
                            singlePersonnel.baseTemplateId
                        ]!.push(singlePersonnel);

                        categorizedPersonnel['all']!.push(singlePersonnel);
                    });

                    return categorizedPersonnel;
                }
            )
        );

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
        type: string
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
