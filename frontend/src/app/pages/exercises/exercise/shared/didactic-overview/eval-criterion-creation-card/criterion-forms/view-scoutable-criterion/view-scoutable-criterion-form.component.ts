import { Component, effect, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    UUID,
} from 'fuesim-digital-shared';

interface LocalInputData {
    targetScoutableId: UUID | '';
}

@Component({
    selector: 'app-view-scoutable-criterion-form',
    templateUrl: './view-scoutable-criterion-form.component.html',
    styleUrls: ['./view-scoutable-criterion-form.component.scss'],
    imports: [FormField, FormsModule],
})
export class ViewScoutableEvalCriterionFormComponent {
    public readonly targetScoutableIdOut = output<UUID>();

    readonly inputModel = signal<LocalInputData>({
        targetScoutableId: '',
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.targetScoutableIdOut.emit(
                this.criterionForm.targetScoutableId().value()
            );
        });
    }

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
