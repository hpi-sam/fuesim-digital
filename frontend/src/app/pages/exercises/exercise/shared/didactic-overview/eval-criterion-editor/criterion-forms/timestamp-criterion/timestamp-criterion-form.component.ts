import { Component, effect, input, output, signal } from '@angular/core';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';
import { AppSaveOnTypingDirective } from '../../../../../../../../shared/directives/app-save-on-typing.directive';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

interface LocalInputData {
    timestampInput: number;
}
@Component({
    selector: 'app-timestamp-criterion-form',
    templateUrl: './timestamp-criterion-form.component.html',
    styleUrls: ['./timestamp-criterion-form.component.scss'],
    imports: [AppSaveOnTypingDirective, FormsModule, FormField],
})
export class timestampEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    public readonly timestampOut = output<number>();

    readonly inputModel = signal<LocalInputData>({
        timestampInput: 0,
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.timestampOut.emit(this.criterionForm.timestampInput().value());
        });
    }
}
