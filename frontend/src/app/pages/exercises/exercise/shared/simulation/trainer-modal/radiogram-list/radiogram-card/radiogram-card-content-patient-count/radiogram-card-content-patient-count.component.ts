import { Component, computed, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectRadiogram,
    selectConfiguration,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { PatientStatusBadgeComponent } from '../../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-radiogram-card-content-patient-count',
    templateUrl: './radiogram-card-content-patient-count.component.html',
    styleUrls: ['./radiogram-card-content-patient-count.component.scss'],
    imports: [PatientStatusBadgeComponent],
})
export class RadiogramCardContentPatientCountComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly radiogramId = input.required<UUID>();

    protected readonly bluePatientsEnabled = this.store.selectSignal(
        createSelector(
            selectConfiguration,
            (configuration) => configuration.bluePatientsEnabled
        )
    );
    public readonly radiogram = computed(() =>
        this.store.selectSignal(
            createSelectRadiogram<PatientCountRadiogram>(this.radiogramId())
        )()
    );
    public readonly totalPatientCount = computed(
        () =>
            this.radiogram().patientCount.black +
            this.radiogram().patientCount.white +
            this.radiogram().patientCount.red +
            this.radiogram().patientCount.yellow +
            this.radiogram().patientCount.green +
            this.radiogram().patientCount.blue
    );
}
