import { Component, effect, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    UUID,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

interface LocalInputData {
    leftChild: UUID | null;
    rightChild: UUID | null;
}

@Component({
    selector: 'app-greater-than-criterion-form',
    templateUrl: './greater-than-criterion-form.component.html',
    styleUrls: ['./greater-than-criterion-form.component.scss'],
    imports: [],
})
export class CompareEvalCriterionFormComponent {
    public readonly leftChildOut = output<UUID | null>();
    public readonly rightChildOut = output<UUID | null>();

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
