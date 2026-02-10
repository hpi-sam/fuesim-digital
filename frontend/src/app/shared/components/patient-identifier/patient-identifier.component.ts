import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Patient, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectPatient } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-patient-identifier',
    templateUrl: './patient-identifier.component.html',
    styleUrls: ['./patient-identifier.component.scss'],
    standalone: false,
})
export class PatientIdentifierComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() patientId!: UUID;

    patient$!: Observable<Patient>;

    ngOnInit(): void {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
    }
}
