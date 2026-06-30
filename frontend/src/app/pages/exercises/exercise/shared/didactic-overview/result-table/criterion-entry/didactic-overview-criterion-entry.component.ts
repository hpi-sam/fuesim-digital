import { Component, input } from '@angular/core';
import { EvalCriterion } from 'fuesim-digital-shared';

@Component({
    selector: 'app-didactic-overview-criterion-entry',
    templateUrl: './didactic-overview-criterion-entry.component.html',
    styleUrls: ['./didactic-overview-criterion-entry.component.scss'],
    imports: [],
})
export class DidacticOverviewCriterionEntryComponent {
    public readonly criterion = input.required<EvalCriterion>();
    /*  public readonly resultsMap = input.required<{
        [criterionId: EvalCriterionId]: EvalResult;
    }>(); */
}
