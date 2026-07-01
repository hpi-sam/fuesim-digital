import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnInit,
    signal,
} from '@angular/core';
import {
    EvalCriterion,
    EvalCriterionId,
    EvalResult,
    getChildResultsOfResult,
    getEvalCriterionTreeDepth,
    isCombinedEvalCriterion,
    UUID,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import {
    selectEvalCriteria,
    selectEvalResults,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { DidacticOverviewResultsSubTable } from './sub-table/didactic-overview-results-sub-table.component';
import { DidacticOverviewCriterionEntryComponent } from './criterion-entry/didactic-overview-criterion-entry.component';
import { EvalResultStatusBadgeComponent } from '../result-status-badge/eval-result-status-badge.component';

interface subTable {
    result: EvalResult;
    index: number;
    subResults: EvalResult[];
    localIndent: number;
    indentOffset: boolean[];
    badgeOffset: boolean[];
}

@Component({
    selector: 'app-didactic-overview-results-table',
    templateUrl: './didactic-overview-results-table.component.html',
    styleUrls: ['./didactic-overview-results-table.component.scss'],
    imports: [
        DidacticOverviewCriterionEntryComponent,
        EvalResultStatusBadgeComponent,
    ],
})
export class DidacticOverViewResultsTableComponent implements OnInit {
    public readonly store = inject<Store<AppState>>(Store);
    public readonly rootResults = input.required<EvalResult[]>();

    public getChildResultsOfResult = getChildResultsOfResult;
    public readonly results = this.store.selectSignal(selectEvalResults);
    public readonly resultsValues = computed(() =>
        Object.values(this.results())
    );
    public readonly evalCriteria = this.store.selectSignal(selectEvalCriteria);

    public readonly extraCols = computed(() =>
        this.getOffset(this.globalDepth() - 1)
    );
    public readonly subTables = signal<subTable[]>([]);

    public readonly subTablesMapCache = signal<{ [resultId: UUID]: subTable }>(
        {}
    );

    ngOnInit(): void {
        this.updateSubTables();
    }
    constructor() {
        effect(async () => {
            this.updateSubTables();
        });
    }

    public async updateSubTables() {
        const currentResults = this.results();
        /* We initialize the sub tables to recursively update it. */
        await this.initCache();
        await this.getSubTablesMap(
            this.rootResults(),
            currentResults,
            this.evalCriteria(),
            0
        );
        const subTablesByIndex = this.getSubTablesByIndex(
            this.subTablesMapCache()
        );
        const resultsLength = Object.values(currentResults).length;
        let subTableUpdate: subTable[] = [];
        for (let i = 0; i < resultsLength; i += 1) {
            subTableUpdate = [...subTableUpdate, subTablesByIndex[i]!];
        }
        await this.subTables.set(subTableUpdate);
    }
    public async initCache() {
        const initTables = Object.values(this.results()).reduce<{
            [resultId: UUID]: subTable;
        }>((obj, result) => {
            obj[result.id] = {
                result: result,
                index: -1,
                subResults: [] as EvalResult[],
                localIndent: 0,
                indentOffset: [],
                badgeOffset: [],
            } as subTable;
            return obj;
        }, {});
        this.subTablesMapCache.set(initTables);
    }

    public async getSubTablesMap(
        rootResults: EvalResult[],
        results: { [criterionId: EvalCriterionId]: EvalResult },
        evalcriteria: { [criterionId: EvalCriterionId]: EvalCriterion },
        runningSubIndex: number
    ) {
        let runningIndex = 0;
        for (let i = 0; i < rootResults.length; i += 1) {
            const res = rootResults[i]!;
            const subResults = getChildResultsOfResult(
                res,
                results,
                evalcriteria
            );
            this.subTablesMapCache.update((cache) => {
                /* update index */
                let table = cache[res.id]!;
                if (table.index === -1) {
                    table.index = runningIndex;
                } else {
                    table.index = runningIndex + runningSubIndex;
                }
                /* update sub results */
                table.subResults = subResults;

                /* update indents of sub results*/
                const localIndent = table.localIndent;
                subResults.forEach((subRes) => {
                    /* TODO @JohannesPotzi : this changes the indent of the root result instead of the subresult */
                    cache[subRes.id]!.localIndent = localIndent + 1;
                    cache[subRes.id]!.index = table.index;
                });
                /* update local indentOffset and bageOffset */
                table.indentOffset = this.getOffset(localIndent);
                table.badgeOffset = this.getOffset(
                    this.globalDepth() - localIndent - 1
                );
                return cache;
            });
            runningIndex += getEvalCriterionTreeDepth(
                res.criterion,
                evalcriteria
            );
            this.getSubTablesMap(
                subResults,
                results,
                evalcriteria,
                runningSubIndex + 1
            );
        }
    }
    public getSubTablesByIndex(cache: { [resultId: UUID]: subTable }) {
        return Object.values(cache).reduce<{
            [index: number]: subTable;
        }>((obj, subTable) => {
            obj[subTable.index] = subTable;
            return obj;
        }, {});
    }

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
            ...this.rootResults().map((res) =>
                getEvalCriterionTreeDepth(res.criterion, this.evalCriteria())
            )
        )
    );
    //**
    // returns an array of a specified length.
    // This allows for an @for in the template.*/
    private getOffset(length: number) {
        let ret = [] as boolean[];
        for (let i = 0; i < length; i += 1) {
            ret = [...ret, true];
        }
        return ret;
    }
}
