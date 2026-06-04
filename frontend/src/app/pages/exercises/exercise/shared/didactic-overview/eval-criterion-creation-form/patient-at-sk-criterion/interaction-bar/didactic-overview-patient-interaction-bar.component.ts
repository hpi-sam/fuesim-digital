import { Component, inject, input, output, signal } from '@angular/core';
import { EvalCriterionCreationForm } from '../../eval-criterion-creation-form.component';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import {
    Patient,
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
} from 'fuesim-digital-shared';
import { SelectPatientService } from '../../../../simulation/trainer-modal/select-patient.service';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { PatientStatusBadgeComponent } from '../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-didactic-overview-patient-interaction-bar',
    templateUrl: './didactic-overview-patient-interaction-bar.component.html',
    styleUrls: ['./didactic-overview-patient-interaction-bar.component.scss'],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        PatientStatusBadgeComponent,
    ],
})
export class DidacticOverviewPatientInteractionBarComponent {
    private readonly exerciseService = inject(ExerciseService);
    readonly selectPatientService = inject(SelectPatientService);
    public submitCriterion = inject(EvalCriterionCreationForm).submitCriterion;
    criterionForm = inject(EvalCriterionCreationForm).criterionForm;
    deleteDisabled: boolean = false;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;

    readonly patient = input.required<Patient>();
    readonly selectedGlobalTargetStatus =
        input.required<PatientStatus | null>();
    readonly targetPatient = output<Patient>();
    readonly targetStatus = output<PatientStatus>();
    readonly selectedTargetStatus = signal<PatientStatus | null>(null);

    public emitTargetStatus() {
        if (this.selectedTargetStatus()) {
            this.targetStatus.emit(this.selectedTargetStatus()!);
        }
    }

    public async deleteSelectedPatient() {
        await this.exerciseService.proposeAction({
            type: '[Patient] Remove patient',
            patientId: this.patient().id,
        });
        this.selectPatientService.selectPatient('');
        this.deleteDisabled = true;
    }
}
