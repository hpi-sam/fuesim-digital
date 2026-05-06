import { Component, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
    NgbAccordionBody,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionDirective,
    NgbAccordionHeader,
    NgbAccordionItem,
} from '@ng-bootstrap/ng-bootstrap';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
} from 'fuesim-digital-shared';
import {
    EvalCriterion,
    type EvalcriterionType,
    evalCriterionTypesNames,
    newXPatientsAtStatusEvalCriterion,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';

interface InputData {
    countInput: number;
    patientStatusInput: PatientStatus;
}
@Component({
    selector: 'app-eval-criterion-creation-form',
    templateUrl: './eval-criterion-creation-form.component.html',
    styleUrls: ['./eval-criterion-creation-form.component.scss'],
    imports: [
        /* NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionButton,
        NgbAccordionCollapse,
        NgbAccordionBody, */
        FormField,
    ],
})
export class EvalCriterionCreationForm {
    private readonly exerciseService = inject(ExerciseService);
    public readonly criterionCreationType = input.required<EvalcriterionType>();
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    readonly inputModel = signal<InputData>({
        countInput: 0,
        patientStatusInput: 'black',
    });
    criterionForm = form(this.inputModel);
    private async createCriterion(criterion: EvalCriterion) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterion',
            criterion,
        });
    }
    public submitCriterion(criterionType: EvalcriterionType) {
        switch (criterionType) {
            case 'xPatientsAtStatusEvalCriterion': {
                const criterion = newXPatientsAtStatusEvalCriterion(
                    'Patienten mit Sichtungskategorie',
                    this.criterionForm.countInput().value(),
                    this.criterionForm.patientStatusInput().value()
                );
                this.createCriterion(criterion);
                break;
            }
            default:
                break;
        }
    }
}
