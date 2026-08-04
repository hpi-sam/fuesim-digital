import { Component } from '@angular/core';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

@Component({
    selector: 'app-count-completed-criterion-form',
    templateUrl: './count-completed-criterion-form.component.html',
    styleUrls: ['./count-completed-criterion-form.component.scss'],
    imports: [],
})
export class CountCompletedEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
