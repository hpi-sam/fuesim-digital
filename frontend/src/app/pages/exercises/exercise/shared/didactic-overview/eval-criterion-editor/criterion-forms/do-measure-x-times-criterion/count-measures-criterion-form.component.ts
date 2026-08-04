import { Component, effect, input, output, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    MeasureTemplateCategory,
    UUID,
} from 'fuesim-digital-shared';

interface LocalInputData {
    targetMeasureTemplateId: UUID | '';
}

@Component({
    selector: 'app-count-measures-criterion-form',
    templateUrl: './count-measures-criterion-form.component.html',
    styleUrls: ['./count-measures-criterion-form.component.scss'],
    imports: [],
})
export class CountMeasuresCriterionFormComponent {
    public readonly measureCategories = input.required<{
        [id: string]: MeasureTemplateCategory;
    }>();
    public readonly targetMeasureTemplateIdOut = output<UUID>();

    readonly inputModel = signal<LocalInputData>({
        targetMeasureTemplateId: '',
    });
    criterionForm = form(this.inputModel);

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    constructor() {
        effect(() => {
            this.targetMeasureTemplateIdOut.emit(
                this.criterionForm.targetMeasureTemplateId().value()
            );
        });
    }
}
