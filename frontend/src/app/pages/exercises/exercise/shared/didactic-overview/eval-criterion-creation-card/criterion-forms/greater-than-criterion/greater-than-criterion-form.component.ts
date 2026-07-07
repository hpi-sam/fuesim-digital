import { Component, effect, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    EvalCriterionId,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

interface LocalInputData {
    leftChild: EvalCriterionId | null;
    rightChild: EvalCriterionId | null;
}

@Component({
    selector: 'app-greater-than-criterion-form',
    templateUrl: './greater-than-criterion-form.component.html',
    styleUrls: ['./greater-than-criterion-form.component.scss'],
    imports: [],
})
export class GreaterThanEvalCriterionFormComponent {
    public readonly leftChildOut = output<EvalCriterionId | null>();
    public readonly rightChildOut = output<EvalCriterionId | null>();

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    readonly inputModel = signal<LocalInputData>({
        leftChild: null,
        rightChild: null,
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.leftChildOut.emit(this.criterionForm.leftChild().value());
            this.rightChildOut.emit(this.criterionForm.rightChild().value());
        });
    }
}
