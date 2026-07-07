import { Component } from '@angular/core';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
} from 'fuesim-digital-shared';

@Component({
    selector: 'app-count-patients-at-status-criterion-form',
    templateUrl: './count-patients-at-status-criterion-form.component.html',
    styleUrls: ['./count-patients-at-status-criterion-form.component.scss'],
    imports: [],
})
export class CountPatientsAtStatusCriterionFormComponent {
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
