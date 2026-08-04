import { Component, effect, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
} from 'fuesim-digital-shared';

interface LocaInputData {
    targetStatus: PatientStatus;
}
@Component({
    selector: 'app-count-patients-at-status-criterion-form',
    templateUrl: './count-patients-at-status-criterion-form.component.html',
    styleUrls: ['./count-patients-at-status-criterion-form.component.scss'],
    imports: [FormsModule, FormField],
})
export class CountPatientsAtStatusCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;

    public readonly targetStatusOut = output<PatientStatus>();

    readonly inputModel = signal<LocaInputData>({
        targetStatus: 'black',
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.targetStatusOut.emit(
                this.criterionForm.targetStatus().value()
            );
        });
    }
}
