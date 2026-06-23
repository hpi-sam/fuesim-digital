import {
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import {
    getPatientVisibleStatus,
    Patient,
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
    UUID,
} from 'fuesim-digital-shared';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { FieldTree } from '@angular/forms/signals';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectConfiguration,
    selectPatients,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../../../simulation/trainer-modal/tabs/compare-patients';
import { SimulatedRegionPreviewCardComponent } from '../../../simulation/trainer-modal/preview-card/simulated-region-preview-card.component';
import { PatientHeaderComponent } from '../../../../../../../shared/components/patient-header/patient-header.component';
import { PatientsDetailsComponent } from '../../../../../../../shared/components/patients-details/patients-details.component';
import { PatientStatusBadgeComponent } from '../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import { InputData } from '../utils/input-data';
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
        PatientStatusBadgeComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
    ],
})
export class PatientAtSKCriterionComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly criterionForm =
        input.required<FieldTree<InputData>>();

    readonly selectedPatientsOut = output<Patient[]>();
    readonly selectedPatientStatusMapOut = output<{
        [id: UUID]: PatientStatus;
    }>();

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
            const selection = this.selected();
            if (selection && !this.patientIds().includes(selection.id)) {
                this.selected.set(null);
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
        if (this.selectedPatients().some((pat) => pat.id === patient.id)) {
            this.removePatient(patient.id);
        } else {
            this.selectedPatients.update((pat) => [...pat, patient]);
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
        if (!this.selectedPatients().some((pat) => pat.id === id)) {
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
