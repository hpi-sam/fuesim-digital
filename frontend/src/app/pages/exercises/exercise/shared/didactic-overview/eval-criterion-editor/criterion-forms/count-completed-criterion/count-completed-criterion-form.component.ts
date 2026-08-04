import { Component, computed, input, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    EvalCriterion,
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    isBoolEvalCriterion,
    UUID,
} from 'fuesim-digital-shared';

interface LocalInputData {
    subCriteria: EvalCriterion[];
}
@Component({
    selector: 'app-count-completed-criterion-form',
    templateUrl: './count-completed-criterion-form.component.html',
    styleUrls: ['./count-completed-criterion-form.component.scss'],
    imports: [],
})
export class CountCompletedEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    public readonly evalCriteria = input.required<{
        [id: UUID]: EvalCriterion;
    }>();
    public readonly boolCriteria = computed(() =>
        Object.values(this.evalCriteria()).filter((crit) =>
            isBoolEvalCriterion(crit)
        )
    );
    public readonly subCriteriaOut = output<EvalCriterion[]>();

    readonly inputModel = signal<LocalInputData>({
        subCriteria: [],
    });
    criterionForm = form(this.inputModel);
    constructor() {
        this.subCriteriaOut.emit(this.criterionForm.subCriteria().value());
    }
}
