import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Component, OnInit } from '@angular/core';
import type { Patient, UUID } from 'digital-fuesim-manv-shared';
import { AppState } from 'src/app/state/app.state.js';
import { createSelectPatient } from 'src/app/state/application/selectors/exercise.selectors.js';
import { PopupService } from '../../utility/popup.service.js';

@Component({
    selector: 'app-patient-popup',
    templateUrl: './patient-popup.component.html',
    styleUrls: ['./patient-popup.component.scss'],
    standalone: false,
})
export class PatientPopupComponent implements OnInit {
    // These properties are only set after OnInit
    public patientId!: UUID;
    patient$!: Observable<Patient>;

    constructor(
        private readonly popupService: PopupService,
        private readonly store: Store<AppState>
    ) {}

    ngOnInit() {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
