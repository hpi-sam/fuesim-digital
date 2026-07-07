import { Component, effect, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    EvalCriterion,
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

interface LocalInputData {
    subCriterion: EvalCriterion | null;
}

@Component({
    selector: 'app-first-true-at-criterion-form',
    templateUrl: './first-true-at-criterion-form.component.html',
    styleUrls: ['./first-true-at-criterion-form.component.scss'],
    imports: [],
})
export class FristTrueAtEvalCriterionFormComponent {
    public readonly subCriterionOut = output<EvalCriterion | null>();

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    readonly inputModel = signal<LocalInputData>({
        subCriterion: null,
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.subCriterionOut.emit(
                this.criterionForm.subCriterion().value()
            );
        });
    }
}
