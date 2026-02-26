import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectRadiogram,
    selectConfiguration,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-patient-count',
    templateUrl: './radiogram-card-content-patient-count.component.html',
    styleUrls: ['./radiogram-card-content-patient-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentPatientCountComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();
    radiogram$!: Observable<PatientCountRadiogram>;
    bluePatientsEnabled$!: Observable<boolean>;
    totalPatientCount$!: Observable<number>;

    ngOnInit(): void {
        const radiogramSelector = createSelectRadiogram<PatientCountRadiogram>(
            this.radiogramId()
        );

        const totalPatientCountSelector = createSelector(
            radiogramSelector,
            (radiogram) =>
                radiogram.patientCount.black +
                radiogram.patientCount.white +
                radiogram.patientCount.red +
                radiogram.patientCount.yellow +
                radiogram.patientCount.green +
                radiogram.patientCount.blue
        );

        const bluePatientsEnabledSelector = createSelector(
            selectConfiguration,
            (configuration) => configuration.bluePatientsEnabled
        );

        this.radiogram$ = this.store.select(radiogramSelector);
        this.totalPatientCount$ = this.store.select(totalPatientCountSelector);
        this.bluePatientsEnabled$ = this.store.select(
            bluePatientsEnabledSelector
        );
    }
}
