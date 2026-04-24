import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Patient, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectPatient } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-patient-name',
    templateUrl: './patient-name.component.html',
    styleUrls: ['./patient-name.component.scss'],
    imports: [AsyncPipe],
})
export class PatientNameComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();

    patient$!: Observable<Patient>;

    ngOnInit(): void {
        this.patient$ = this.store.select(
            createSelectPatient(this.patientId())
        );
    }
}
