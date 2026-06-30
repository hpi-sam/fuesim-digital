import { Component, computed, inject, input, signal } from '@angular/core';
import {
    EvalCriterionId,
    EvalResult,
    getEvalCriterionTreeDepth,
    isCombinedEvalCriterion,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectEvalCriteria } from '../../../../../../state/application/selectors/exercise.selectors';
import { DidacticOverviewResultsSubTable } from './sub-table/didactic-overview-results-sub-table.component';

@Component({
    selector: 'app-didactic-overview-results-table',
    templateUrl: './didactic-overview-results-table.component.html',
    styleUrls: ['./didactic-overview-results-table.component.scss'],
    imports: [DidacticOverviewResultsSubTable],
})
export class DidacticOverViewResultsTableComponent {
    public readonly store = inject<Store<AppState>>(Store);
    public readonly results = input.required<EvalResult[]>();
    public readonly resultsMap = input.required<{
        [criterionId: EvalCriterionId]: EvalResult;
    }>();
    public readonly colums = signal<string[]>([]);
    public readonly evalCriteria = this.store.selectSignal(selectEvalCriteria);

    public readonly tableContext = input.required<'baseTable' | 'subTable'>();
    public readonly tableMinWidth = input<number>(590);
    public readonly maxIndent = computed(() =>
        this.tableContext() === 'subTable' ? 100 : 0
    );
    public readonly minIndent = computed(() =>
        this.tableContext() === 'subTable' ? 50 : 0
    );
    public readonly overflow = computed(() =>
        this.tableContext() === 'subTable' ? 'visible' : 'auto'
    );
    public readonly getTableMinWidth = computed(() =>
        this.tableContext() === 'subTable'
            ? this.tableMinWidth() - this.maxIndent()
            : this.tableMinWidth()
    );
    public readonly getTableClass = computed(() =>
        this.tableContext() === 'subTable'
            ? 'card col rounded-0 rounded-end'
            : ''
    );

    public isCombinedEvalCriterion = isCombinedEvalCriterion;

    public getEvalCriterionTreeDepth = getEvalCriterionTreeDepth;
    public readonly globalDepth = computed(() =>
        Math.max(
            ...this.results().map((res) =>
                getEvalCriterionTreeDepth(res.criterion, this.evalCriteria())
            )
        )
    );
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
    public readonly extraCols = computed(() =>
        this.getOffset(this.globalDepth() - 1)
    );
}
