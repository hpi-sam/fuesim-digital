import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { Patient } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { createSelectPatient } from '../../../state/application/selectors/exercise.selectors';
import { PatientIdentifierComponent } from '../patient-identifier/patient-identifier.component';
import { PatientHealthPointDisplayComponent } from '../patient-health-point-display/patient-health-point-display.component';

@Component({
    selector: 'app-patient-header',
    templateUrl: './patient-header.component.html',
    styleUrls: ['./patient-header.component.scss'],
    imports: [
        PatientIdentifierComponent,
        PatientHealthPointDisplayComponent,
        AsyncPipe,
    ],
})
export class PatientHeaderComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly patientId = input.required<UUID>();

    patient$!: Observable<Patient>;

    ngOnChanges(): void {
        this.patient$ = this.store.select(
            createSelectPatient(this.patientId())
        );
    }
}
