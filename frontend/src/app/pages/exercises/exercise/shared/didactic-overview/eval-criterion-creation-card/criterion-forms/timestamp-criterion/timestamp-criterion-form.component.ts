import { Component } from '@angular/core';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

@Component({
    selector: 'app-timestamp-criterion-form',
    templateUrl: './timestamp-criterion-form.component.html',
    styleUrls: ['./timestamp-criterion-form.component.scss'],
    imports: [],
})
export class timeStampEvalCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
