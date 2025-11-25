import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Patient, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectPatient } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-patient-name',
    templateUrl: './patient-name.component.html',
    styleUrls: ['./patient-name.component.scss'],
    standalone: false,
})
export class PatientNameComponent implements OnInit {
    @Input() patientId!: UUID;

    patient$!: Observable<Patient>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
    }
}
