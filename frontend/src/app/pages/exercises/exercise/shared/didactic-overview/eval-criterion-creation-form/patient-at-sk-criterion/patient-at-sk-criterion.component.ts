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
import {
    getPatientVisibleStatus,
    Patient,
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
    UUID,
} from 'fuesim-digital-shared';
import {
    selectConfiguration,
    selectPatients,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../../../simulation/trainer-modal/tabs/compare-patients';
import { SimulatedRegionPreviewCardComponent } from '../../../simulation/trainer-modal/preview-card/simulated-region-preview-card.component';
import { PatientHeaderComponent } from '../../../../../../../shared/components/patient-header/patient-header.component';
import { PatientsDetailsComponent } from '../../../../../../../shared/components/patients-details/patients-details.component';
import { DidacticOverviewPatientInteractionBarComponent } from './interaction-bar/didactic-overview-patient-interaction-bar.component';
import { PatientStatusBadgeComponent } from '../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { elementAt } from 'rxjs';

@Component({
    selector: 'app-patient-at-sk-criterion',
    templateUrl: './patient-at-sk-criterion.component.html',
    styleUrls: ['./patient-at-sk-criterion.component.scss'],
    imports: [
        SimulatedRegionPreviewCardComponent,
        PatientHeaderComponent,
        PatientsDetailsComponent,
        DidacticOverviewPatientInteractionBarComponent,
        PatientStatusBadgeComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
    ],
})
export class PatientAtSKCriterionComponent {
    readonly selectedPatientsOut = output<Patient[]>();
    readonly selectedPatientStatusMapOut = output<{
        [id: UUID]: PatientStatus;
    }>();

    private readonly store = inject<Store<AppState>>(Store);
    readonly selected = signal<Patient | null>(null);
    readonly selectedPatients = signal<Patient[]>([]);
    readonly selectedTargetStatus = signal<PatientStatus | null>(null);
    readonly selectedPatientStatusMap = signal<{
        [id: UUID]: PatientStatus;
    }>({});

    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;

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
        });
    }
    public selectPatient(patient: Patient) {
        const currentlySelected = this.selected();
        if (currentlySelected?.id === patient.id) {
            this.selected.set(null);
        } else {
            this.selected.set(patient);
        }
    }
    public addPatient(patient: Patient) {
        if (this.selectedPatients().find((pat) => pat.id === patient.id)) {
            this.removePatient(patient.id);
        } else {
            this.selectedPatients.update((pat) => {
                return [...pat, patient];
            });
            this.selectedPatientsOut.emit(this.selectedPatients());
        }
    }
    public removePatient(patientId: UUID) {
        this.selectedPatients.update((patients) => {
            patients.splice(
                patients.findIndex((pat) => pat.id === patientId),
                1
            );
            return patients;
        });
        this.selectedPatientsOut.emit(this.selectedPatients());
    }
    public updateSelectedPatientStatusMap(
        id: UUID,
        status: PatientStatus | null
    ) {
        if (!this.selectedPatients().find((pat) => pat.id === id)) {
            console.log(
                'trying to assign a PatientStatus to a Patient not in selection.'
            );
            return;
        }
        if (this.selectedPatientStatusMap()[id] === status) {
            return;
        }
        this.selectedPatientStatusMap.update((val) => {
            if (!status) {
                delete val[id];
            } else {
                val[id] = status;
            }
            return val;
        });
        this.selectedPatientStatusMapOut.emit(this.selectedPatientStatusMap());
    }
}
