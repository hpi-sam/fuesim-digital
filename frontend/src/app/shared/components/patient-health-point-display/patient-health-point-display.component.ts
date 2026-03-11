import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus, UUID } from 'fuesim-digital-shared';
import {
    healthPointsDefaults,
    Patient,
    statusNames,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import {
    createSelectPatient,
    selectConfiguration,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-patient-health-point-display',
    templateUrl: './patient-health-point-display.component.html',
    styleUrls: ['./patient-health-point-display.component.scss'],
    standalone: false,
})
export class PatientHealthPointDisplayComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();

    status$!: Observable<{
        real: PatientStatus;
        visible: PatientStatus;
        health: number;
    }>;

    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    public readonly healthPointsDefaults = healthPointsDefaults;

    ngOnChanges(): void {
        this.status$ = this.store.select(
            createSelector(
                createSelectPatient(this.patientId()),
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
