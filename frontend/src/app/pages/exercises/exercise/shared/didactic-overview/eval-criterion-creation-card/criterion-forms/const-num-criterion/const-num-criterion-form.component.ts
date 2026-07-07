import { Component } from '@angular/core';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

@Component({
    selector: 'app-const-num-criterion-form',
    templateUrl: './const-num-criterion-form.component.html',
    styleUrls: ['./const-num-criterion-form.component.scss'],
    imports: [],
})
export class ConstNumEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
