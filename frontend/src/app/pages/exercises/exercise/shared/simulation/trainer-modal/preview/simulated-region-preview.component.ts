import { Component, Input, OnInit } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { Patient, SimulatedRegion } from 'digital-fuesim-manv-shared';
import { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { PatientCategory } from '../tabs/general-tab/simulated-region-overview-general-tab.component';
import type { UUID } from 'digital-fuesim-manv-shared';
import { PatientWithVisibleStatus } from '../patients-table/simulated-region-overview-patients-table.component';
import {
    createSelectElementsInSimulatedRegion,
    selectConfiguration,
    selectPatients,
} from 'src/app/state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../tabs/compare-patients';
@Component({
    selector: 'app-simulated-region-preview',
    templateUrl: './simulated-region-preview.component.html',
    styleUrls: ['./simulated-region-preview.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewComponent implements OnInit {
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
