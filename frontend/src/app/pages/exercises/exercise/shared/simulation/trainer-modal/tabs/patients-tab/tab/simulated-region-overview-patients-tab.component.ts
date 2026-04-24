import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import {
    getPatientVisibleStatus,
    SimulatedRegion,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { comparePatientsByVisibleStatus } from '../../compare-patients';
import type { PatientWithVisibleStatus } from '../../../patients-table/simulated-region-overview-patients-table.component';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectPatients,
    selectConfiguration,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { SimulatedRegionOverviewPatientsTableComponent } from '../../../patients-table/simulated-region-overview-patients-table.component';
import { SimulatedRegionOverviewPatientDetailsComponent } from '../details/simulated-region-overview-patient-details.component';

@Component({
    selector: 'app-simulated-region-overview-patients-tab',
    templateUrl: './simulated-region-overview-patients-tab.component.html',
    styleUrls: ['./simulated-region-overview-patients-tab.component.scss'],
    imports: [
        SimulatedRegionOverviewPatientsTableComponent,
        SimulatedRegionOverviewPatientDetailsComponent,
        AsyncPipe,
    ],
})
export class SimulatedRegionOverviewPatientsTabComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegion = input.required<SimulatedRegion>();
    readonly selectedPatientId = input<UUID>();

    patients$!: Observable<PatientWithVisibleStatus[]>;

    ngOnInit(): void {
        this.patients$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectPatients,
                    this.simulatedRegion().id
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
                            visibleStatus: getPatientVisibleStatus(
                                patient,
                                configuration.pretriageEnabled,
                                configuration.bluePatientsEnabled
                            ),
                            ...patient,
                        }))
            )
        );
    }
}
