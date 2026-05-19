import { Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import type { AppState } from '../../../state/app.state';
import { createSelectPatient } from '../../../state/application/selectors/exercise.selectors';
import { PatientIdentifierComponent } from '../patient-identifier/patient-identifier.component';
import { PatientHealthPointDisplayComponent } from '../patient-health-point-display/patient-health-point-display.component';

@Component({
    selector: 'app-patient-header',
    templateUrl: './patient-header.component.html',
    styleUrls: ['./patient-header.component.scss'],
    imports: [PatientIdentifierComponent, PatientHealthPointDisplayComponent],
})
export class PatientHeaderComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();

    readonly patient = computed(() =>
        this.store.selectSignal(createSelectPatient(this.patientId()))()
    );
}
