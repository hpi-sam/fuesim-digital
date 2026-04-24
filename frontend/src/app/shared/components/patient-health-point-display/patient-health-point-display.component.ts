import { computed, Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import {
    getPatientVisibleStatus,
    healthPointsDefaults,
    isPatientBystander,
    statusNames,
} from 'fuesim-digital-shared';
import { NgStyle, PercentPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import {
    createSelectPatient,
    selectConfiguration,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-patient-health-point-display',
    templateUrl: './patient-health-point-display.component.html',
    styleUrls: ['./patient-health-point-display.component.scss'],
    imports: [NgStyle, PercentPipe],
})
export class PatientHealthPointDisplayComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();
    readonly patient = computed(() =>
        this.store.selectSignal(createSelectPatient(this.patientId()))()
    );
    readonly configuration = this.store.selectSignal(selectConfiguration);
    readonly isBystander = computed(() => isPatientBystander(this.patient()));
    readonly status = computed(() => ({
        real: this.patient().realStatus,
        visible: getPatientVisibleStatus(
            this.patient(),
            this.configuration().pretriageEnabled,
            this.configuration().bluePatientsEnabled
        ),
        health: this.patient().health,
    }));

    public readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );

    public readonly healthPointsDefaults = healthPointsDefaults;

    public statusNames = statusNames;
}
