import {
    Component,
    computed,
    effect,
    inject,
    OnInit,
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

@Component({
    selector: 'app-patient-at-sk-criterion',
    templateUrl: './patient-at-sk-criterion.component.html',
    styleUrls: ['./patient-at-sk-criterion.component.scss'],
    imports: [
        SimulatedRegionPreviewCardComponent,
        PatientHeaderComponent,
        PatientsDetailsComponent,
    ],
})
export class PatientAtSKCriterionComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    readonly selected = signal<Patient | null>(null);
    readonly selectedPatients = signal<Patient[]>([]);
    readonly patients = signal<Patient[]>([]);
    readonly patientIds = computed(() => this.patients().map((p) => p.id));
    constructor() {
        effect(() => {
            if (this.patientIds()) {
                const selection = this.selected();
                if (selection && !this.patientIds().includes(selection.id)) {
                    this.selected.set(null);
                }
            }
        });
    }
    ngOnInit(): void {
        this.patients.set(
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
    }
    addPatient(patient: Patient) {
        this.selectedPatients.update((patients) => {
            return [...patients, patient];
        });
    }
    removePatient(patientId: UUID) {
        this.selectedPatients.update((patients) => {
            patients.splice(
                patients.findIndex((P) => P.id === patientId),
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
