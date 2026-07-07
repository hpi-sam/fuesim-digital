import { Component, effect, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    EvalCriterionId,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

interface LocalInputData {
    targetCriterion: EvalCriterionId | null;
}

@Component({
    selector: 'app-not-criterion-form',
    templateUrl: './not-criterion-form.component.html',
    styleUrls: ['./not-criterion-form.component.scss'],
    imports: [],
})
export class NotEvalCriterionFormComponent {
    public readonly targetCriterionOut = output<EvalCriterionId | null>();

    readonly inputModel = signal<LocalInputData>({
        targetCriterion: null,
    });
    criterionForm = form(this.inputModel);

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    constructor() {
        effect(() => {
            this.targetCriterionOut.emit(
                this.criterionForm.targetCriterion().value()
            );
        });
    }
}
