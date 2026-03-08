import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Component, OnInit, inject } from '@angular/core';
import type { Patient, UUID } from 'fuesim-digital-shared';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectPatient } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-patient-popup',
    templateUrl: './patient-popup.component.html',
    styleUrls: ['./patient-popup.component.scss'],
    standalone: false,
})
export class PatientPopupComponent implements OnInit {
    private readonly popupService = inject(PopupService);
    private readonly store = inject<Store<AppState>>(Store);

    // These properties are only set after OnInit
    public patientId!: UUID;
    patient$!: Observable<Patient>;

    ngOnInit() {
        this.patient$ = this.store.select(createSelectPatient(this.patientId));
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
