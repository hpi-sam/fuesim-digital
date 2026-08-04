import {
    Component,
    computed,
    effect,
    input,
    output,
    signal,
} from '@angular/core';
import {
    EvalCriterionCategory,
    EvalCriterionType,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';
import { InputData } from '../input-data';
import { FieldTree, form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { AppSaveOnTypingDirective } from '../../../../../../../shared/directives/app-save-on-typing.directive';
import { PatientAtStatusCriterionFormComponent } from './patient-at-status-criterion/patient-at-status-criterion-form.component';
import { CountPatientsAtStatusCriterionFormComponent } from './count-patients-at-status-criterion/count-patients-at-status-criterion-form.component';
import { ReachTechnicalChallengeStateEvalCriterionFormComponent } from './reach-technical-challenge-state-criterion/reach-technical-challenge-state-criterion-form.component';
import { ViewScoutableEvalCriterionFormComponent } from './view-scoutable-criterion/view-scoutable-criterion-form.component';

@Component({
    selector: 'app-eval-criterion-forms',
    templateUrl: './criterion-forms.component.html',
    styleUrls: ['./criterion-forms.component.scss'],
    imports: [
        FormsModule,
        FormField,
        AppSaveOnTypingDirective,
        PatientAtStatusCriterionFormComponent,
        CountPatientsAtStatusCriterionFormComponent,
        ReachTechnicalChallengeStateEvalCriterionFormComponent,
        ViewScoutableEvalCriterionFormComponent,
    ],
})
export class EvalCriterionFormsComponent {
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    readonly criterionFormOut = output<FieldTree<InputData, string | number>>();

    constructor() {
        effect(() => {
            this.criterionFormOut.emit(this.criterionForm);
        });
    }

    public readonly criterionCreationCategory =
        input.required<EvalCriterionCategory | null>();

    public readonly criterionCreationType =
        input.required<EvalCriterionType | null>();

    public readonly criterionCreationTypeName = computed(() => {
        const selectedType = this.criterionCreationType();
        return selectedType ? this.evalCriterionTypesNames[selectedType] : '';
    });

    readonly inputModel = signal<InputData>({
        name: '',
        countInput: 0,
        timestampInput: 0,
        patientStatusInput: 'black',
        technicalChallengeId: '',
        targetStateMachineIds: [],
        targetStateMachineStateIds: {},
        targetPatients: [],
        targetPatientsStatusMap: {},
        targetScoutableId: '',
        subCriteria: [],
        singleSubCriterion: '',
    });
    criterionForm = form(this.inputModel);
}
