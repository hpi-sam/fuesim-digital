import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { Patient } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { createSelectPatient } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-patient-header',
    templateUrl: './patient-header.component.html',
    styleUrls: ['./patient-header.component.scss'],
    standalone: false,
})
export class PatientHeaderComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input() patientId!: UUID;

    patient$!: Observable<Patient>;

    ngOnChanges(): void {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
    }
}
