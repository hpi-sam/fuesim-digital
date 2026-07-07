import { Component, effect, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

interface LocalInputData {}

@Component({
    selector: 'app-do-measure-x-times-criterion-form',
    templateUrl: './do-measure-x-times-criterion-form.component.html',
    styleUrls: ['./do-measure-x-times-criterion-form.component.scss'],
    imports: [],
})
export class DoMeasureXTimesCriterionFormComponent {
    /* TODO @JohannesPotzi : declare output signals */

    readonly inputModel = signal<LocalInputData>({});
    criterionForm = form(this.inputModel);

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    constructor() {
        effect(() => {
            /* TODO @JohannesPotzi : output criterionForm values*/
        });
    }
}
