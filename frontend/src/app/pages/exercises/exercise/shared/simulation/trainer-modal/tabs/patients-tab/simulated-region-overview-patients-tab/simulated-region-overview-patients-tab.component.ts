import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Patient, SimulatedRegion } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectElementsInSimulatedRegion,
    selectConfiguration,
    selectPatients,
} from 'src/app/state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../../compare-patients';
import type { PatientWithVisibleStatus } from '../../../patients-table/simulated-region-overview-patients-table.component';

@Component({
    selector: 'app-simulated-region-overview-patients-tab',
    templateUrl: './simulated-region-overview-patients-tab.component.html',
    styleUrls: ['./simulated-region-overview-patients-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewPatientsTabComponent implements OnInit {
    @Input() simulatedRegion!: SimulatedRegion;
    @Input() selectedPatientId?: UUID;

    patients$!: Observable<PatientWithVisibleStatus[]>;

    constructor(private readonly store: Store<AppState>) {}

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
