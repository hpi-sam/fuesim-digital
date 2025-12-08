import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus, UUID } from 'digital-fuesim-manv-shared';
import {
    healthPointsDefaults,
    Patient,
    statusNames,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectPatient,
    selectConfiguration,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';

@Component({
    selector: 'app-patient-health-point-display',
    templateUrl: './patient-health-point-display.component.html',
    styleUrls: ['./patient-health-point-display.component.scss'],
    standalone: false,
})
export class PatientHealthPointDisplayComponent implements OnInit {
    @Input() patientId!: UUID;

    status$!: Observable<{
        real: PatientStatus;
        visible: PatientStatus;
        health: number;
    }>;

    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    public readonly healthPointsDefaults = healthPointsDefaults;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.status$ = this.store.select(
            createSelector(
                createSelectPatient(this.patientId),
                selectConfiguration,
                (patient, configuration) => ({
                    real: patient.realStatus,
                    visible: Patient.getVisibleStatus(
                        patient,
                        configuration.pretriageEnabled,
                        configuration.bluePatientsEnabled
                    ),
                    health: patient.health,
                })
            )
        );
    }

    public get statusNames() {
        return statusNames;
    }
}
