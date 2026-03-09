import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { Patient, SimulatedRegion } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { comparePatientsByVisibleStatus } from '../../compare-patients';
import type { PatientWithVisibleStatus } from '../../../patients-table/simulated-region-overview-patients-table.component';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectPatients,
    selectConfiguration,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-patients-tab',
    templateUrl: './simulated-region-overview-patients-tab.component.html',
    styleUrls: ['./simulated-region-overview-patients-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewPatientsTabComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() simulatedRegion!: SimulatedRegion;
    @Input() selectedPatientId?: UUID;

    patients$!: Observable<PatientWithVisibleStatus[]>;

    ngOnInit(): void {
        this.patients$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectPatients,
                    this.simulatedRegion.id
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
    }
}
