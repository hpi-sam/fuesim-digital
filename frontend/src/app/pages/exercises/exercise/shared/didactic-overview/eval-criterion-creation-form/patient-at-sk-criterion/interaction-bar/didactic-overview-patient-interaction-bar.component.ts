import { Component, inject, input, output, signal } from '@angular/core';
import {
    
    Patient,
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
} from 'fuesim-digital-shared';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { FieldTree } from '@angular/forms/signals';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { SelectPatientService } from '../../../../simulation/trainer-modal/select-patient.service';
import { PatientStatusBadgeComponent } from '../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import { InputData } from '../../utils/input-data';

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
    deleteDisabled = false;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;

    public readonly criterionForm =
        input.required<FieldTree<InputData>>();
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
