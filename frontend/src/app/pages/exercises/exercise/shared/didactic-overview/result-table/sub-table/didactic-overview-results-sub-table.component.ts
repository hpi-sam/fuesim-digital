import { Component, computed, input } from '@angular/core';
import {
    EvalCriterion,
    EvalCriterionId,
    EvalResult,
    getChildResultsOfResult,
    isCombinedEvalCriterion,
    UUID,
} from 'fuesim-digital-shared';
import { EvalResultStatusBadgeComponent } from '../../result-status-badge/eval-result-status-badge.component';
import { DidacticOverviewCriterionEntryComponent } from '../criterion-entry/didactic-overview-criterion-entry.component';
import { number } from 'zod';

@Component({
    selector: 'app-didactic-overview-results-sub-table',
    templateUrl: './didactic-overview-results-sub-table.component.html',
    styleUrls: ['./didactic-overview-results-sub-table.component.scss'],
    imports: [
        EvalResultStatusBadgeComponent,
        DidacticOverviewCriterionEntryComponent,
    ],
})
export class DidacticOverviewResultsSubTable {
    public readonly results = input.required<EvalResult[]>();
    public readonly resultsMap = input.required<{
        [criterionId: EvalCriterionId]: EvalResult;
    }>();
    public readonly criteria = input.required<{
        [criterionId: EvalCriterionId]: EvalCriterion;
    }>();
    public readonly localDepth = input.required<number>();
    public readonly globalDepth = input.required<number>();

    public getChildResultsOfResult = getChildResultsOfResult;
    public isCombinedEvalCriterion = isCombinedEvalCriterion;

    //**
    // returns an array of a specified length.
    // This allows for an @for in the template.*/
    private getOffset(length: number) {
        let ret = [] as Boolean[];
        for (let i = 0; i < length; i += 1) {
            ret = [...ret, true];
        }
        return ret;
    }
    public readonly indent = computed(() =>
        this.getOffset(this.localDepth() - 1)
    );

    public readonly badgeOffset = computed(() =>
        this.getOffset(this.globalDepth() - this.localDepth() + 1)
    );
    public readonly childResultsMap = computed(() =>
        this.results().reduce<{ [id: UUID]: EvalResult[] }>((obj, res) => {
            obj[res.id] = getChildResultsOfResult(
                res,
                this.resultsMap(),
                this.criteria()
            );
            return obj;
        }, {})
    );
}
