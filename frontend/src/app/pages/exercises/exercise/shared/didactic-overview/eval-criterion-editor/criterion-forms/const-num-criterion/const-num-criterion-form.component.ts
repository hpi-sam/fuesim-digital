import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';
import { AppSaveOnTypingDirective } from '../../../../../../../../shared/directives/app-save-on-typing.directive';
import { form } from '@angular/forms/signals';

interface LocalInputData {
    num: number;
}
@Component({
    selector: 'app-const-num-criterion-form',
    templateUrl: './const-num-criterion-form.component.html',
    styleUrls: ['./const-num-criterion-form.component.scss'],
    imports: [FormsModule, AppSaveOnTypingDirective],
})
export class ConstNumEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    public readonly numOut = output<number>();

    readonly inputModel = signal<LocalInputData>({
        num: 0,
    });
    criterionForm = form(this.inputModel);

    constructor() {
        this.numOut.emit(this.criterionForm.num().value());
    }
}
