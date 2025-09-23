import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Patient } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectPatient,
    selectConfiguration,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentRole } from 'src/app/state/application/selectors/shared.selectors';

@Component({
    selector: 'app-patients-details',
    templateUrl: './patients-details.component.html',
    styleUrls: ['./patients-details.component.scss'],
    standalone: false,
})
export class PatientsDetailsComponent implements OnChanges {
    @Input() patientId!: UUID;

    readonly currentRole$ = this.store.select(selectCurrentRole);
    configuration$ = this.store.select(selectConfiguration);
    patient$!: Observable<Patient>;
    visibleStatus$!: Observable<PatientStatus>;
    pretriageStatusIsLocked$?: Observable<boolean>;
    readonly pretriageOptions$: Observable<PatientStatus[]> =
        this.configuration$.pipe(
            map((configuration) =>
                configuration.bluePatientsEnabled
                    ? ['white', 'black', 'blue', 'red', 'yellow', 'green']
                    : ['white', 'black', 'red', 'yellow', 'green']
            )
        );

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    ngOnChanges(): void {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
        this.visibleStatus$ = this.store.select(
            createSelector(
                createSelectPatient(this.patientId),
                selectConfiguration,
                (patient, configuration) =>
                    Patient.getVisibleStatus(
                        patient,
                        configuration.pretriageEnabled,
                        configuration.bluePatientsEnabled
                    )
            )
        );
        this.pretriageStatusIsLocked$ = this.patient$.pipe(
            map((patient) => Patient.pretriageStatusIsLocked(patient))
        );
    }

    setPretriageCategory(patientStatus: PatientStatus) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Visible Status',
            patientId: this.patientId,
            patientStatus,
        });
    }

    updateRemarks(remarks: string) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Remarks',
            patientId: this.patientId,
            remarks,
        });
    }

    updateCustomQRCode(customQRCode: string) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Custom QR Code',
            patientId: this.patientId,
            customQRCode,
        });
    }
}
