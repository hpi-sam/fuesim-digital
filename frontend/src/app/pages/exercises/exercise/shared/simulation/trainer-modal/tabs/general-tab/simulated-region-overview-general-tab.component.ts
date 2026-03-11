import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    Material,
    Patient,
    PatientStatus,
    Personnel,
    Vehicle,
} from 'fuesim-digital-shared';
import { SimulatedRegion } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    selectVehicleTemplates,
    selectPersonnelTemplates,
    selectMaterialTemplates,
    createSelectElementsInSimulatedRegion,
    selectPatients,
    createSelectByPredicate,
    selectVehicles,
    selectPersonnel,
    selectMaterials,
} from '../../../../../../../../state/application/selectors/exercise.selectors';

const patientCategories = ['red', 'yellow', 'green', 'black'] as const;
export type PatientCategory = (typeof patientCategories)[number];

@Component({
    selector: 'app-simulated-region-overview-general-tab',
    templateUrl: './simulated-region-overview-general-tab.component.html',
    styleUrls: ['./simulated-region-overview-general-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewGeneralTabComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegion = input.required<SimulatedRegion>();

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );
    public readonly personnelTemplates$ = this.store.select(
        selectPersonnelTemplates
    );
    public readonly materialTemplates$ = this.store.select(
        selectMaterialTemplates
    );

    public readonly patientCategories = patientCategories;

    patients: {
        [Key in `${PatientCategory | 'all'}$`]?: Observable<Patient[]>;
    } = {};

    vehicles$?: Observable<{ [Key in string]?: Vehicle[] }>;

    personnel$?: Observable<{ [Key in string]?: Personnel[] }>;

    materials$?: Observable<{ [Key in string]?: Material[] }>;

    public patientsCollapsed = true;
    public vehiclesCollapsed = true;
    public personnelCollapsed = true;
    public materialsCollapsed = true;

    ngOnInit(): void {
        const containedPatientsSelector = createSelectElementsInSimulatedRegion(
            selectPatients,
            this.simulatedRegion().id
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
                    this.simulatedRegion().id
                ),
                (vehicleTemplates, vehicles) => {
                    const categorizedVehicles: { [Key in string]?: Vehicle[] } =
                        {};

                    categorizedVehicles['all'] = [];

                    vehicles.forEach((vehicle) => {
                        categorizedVehicles[vehicle.templateId] ??= [];

                        categorizedVehicles[vehicle.templateId]!.push(vehicle);

                        categorizedVehicles['all']!.push(vehicle);
                    });

                    return categorizedVehicles;
                }
            )
        );

        this.personnel$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectPersonnel,
                    this.simulatedRegion().id
                ),
                (personnel) => {
                    const categorizedPersonnel: {
                        [Key in string]?: Personnel[];
                    } = {};

                    categorizedPersonnel['all'] = [];

                    personnel.forEach((singlePersonnel) => {
                        categorizedPersonnel[singlePersonnel.templateId] ??= [];

                        categorizedPersonnel[singlePersonnel.templateId]!.push(
                            singlePersonnel
                        );

                        categorizedPersonnel['all']!.push(singlePersonnel);
                    });

                    return categorizedPersonnel;
                }
            )
        );

        this.materials$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectMaterials,
                    this.simulatedRegion().id
                ),
                (materials) => {
                    const categorizedMaterials: {
                        [Key in string]?: Material[];
                    } = {};

                    categorizedMaterials['all'] = [];

                    materials.forEach((material) => {
                        categorizedMaterials[material.templateId] ??= [];

                        categorizedMaterials[material.templateId]!.push(
                            material
                        );

                        categorizedMaterials['all']!.push(material);
                    });

                    return categorizedMaterials;
                }
            )
        );
    }

    createPatientStatusPredicate(
        status: PatientStatus
    ): (patient: Patient) => boolean {
        return (patient) => patient.realStatus === status;
    }

    public async renameSimulatedRegion(newName: string) {
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Rename simulated region',
            simulatedRegionId: this.simulatedRegion().id,
            newName,
        });
    }
}
