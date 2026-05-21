import {
    Component,
    computed,
    effect,
    inject,
    output,
    signal,
} from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import { getPatientVisibleStatus, Patient, UUID } from 'fuesim-digital-shared';
import {
    selectConfiguration,
    selectPatients,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../../../simulation/trainer-modal/tabs/compare-patients';
import { SimulatedRegionPreviewCardComponent } from '../../../simulation/trainer-modal/preview-card/simulated-region-preview-card.component';
import { PatientHeaderComponent } from '../../../../../../../shared/components/patient-header/patient-header.component';
import { PatientsDetailsComponent } from '../../../../../../../shared/components/patients-details/patients-details.component';
import { DidacticOverviewPatientInteractionBarComponent } from './interaction-bar/didactic-overview-patient-interaction-bar.component';

@Component({
    selector: 'app-patient-at-sk-criterion',
    templateUrl: './patient-at-sk-criterion.component.html',
    styleUrls: ['./patient-at-sk-criterion.component.scss'],
    imports: [
        SimulatedRegionPreviewCardComponent,
        PatientHeaderComponent,
        PatientsDetailsComponent,
        DidacticOverviewPatientInteractionBarComponent,
    ],
})
export class PatientAtSKCriterionComponent {
    readonly selectedPatientsOut = output<Patient[]>();

    private readonly store = inject<Store<AppState>>(Store);
    readonly selected = signal<Patient | null>(null);
    readonly selectedPatients = signal<Patient[]>([]);

    readonly patients = computed(() =>
        this.store.selectSignal(
            createSelector(
                selectPatients,
                selectConfiguration,
                (patientsUnsorted, configuration) =>
                    Object.values(patientsUnsorted)
                        .sort((patientA, patientB) =>
                            comparePatientsByVisibleStatus(
                                patientA,
                                patientB,
                                configuration
                            )
                        )
                        .map((patient) => ({
                            visibleStatus: getPatientVisibleStatus(
                                patient,
                                configuration.pretriageEnabled,
                                configuration.bluePatientsEnabled
                            ),
                            ...patient,
                        }))
            )
        )()
    );
    readonly patientIds = computed(() => this.patients().map((p) => p.id));
    constructor() {
        effect(() => {
            if (this.patientIds()) {
                const selection = this.selected();
                if (selection && !this.patientIds().includes(selection.id)) {
                    this.selected.set(null);
                }
            }
            if (this.selectedPatients()) {
                this.selectedPatientsOut.emit(this.selectedPatients());
            }
        });
    }
    addPatient(patient: Patient) {
        this.selectedPatients.update((pat) => {
            return [...pat, patient];
        });
    }
    removePatient(patientId: UUID) {
        this.selectedPatients.update((patients) => {
            patients.splice(
                patients.findIndex((pat) => pat.id === patientId),
                1
            );
            return patients;
        });
    }
    selectPatient(patient: Patient) {
        const currentlySelected = this.selected();
        if (currentlySelected?.id === patient.id) {
            this.selected.set(null);
        } else {
            this.selected.set(patient);
        }
    }
}
