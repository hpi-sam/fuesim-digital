import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnInit,
    output,
    signal,
    WritableSignal,
} from '@angular/core';
import {
    EvalCriterionId,
    EvalResult,
    getChildResultsOfResult,
    getEvalCriterionTreeDepth,
    isCombinedEvalCriterion,
    uuid,
    UUID,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import {
    selectEvalCriteria,
    selectEvalResults,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { DidacticOverviewCriterionEntryComponent } from './criterion-entry/didactic-overview-criterion-entry.component';
import { EvalResultStatusBadgeComponent } from '../result-status-badge/eval-result-status-badge.component';
import { FormsModule } from '@angular/forms';

interface subTable {
    id: UUID;
    result: EvalResult;
    index: number;
    subResults: EvalResult[];
    subTables: UUID[];
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
        FormsModule,
    ],
})
export class DidacticOverViewResultsTableComponent implements OnInit {
    public readonly store = inject<Store<AppState>>(Store);
    public readonly isInSelectionModeInput = input<boolean>(true);
    public readonly rootResults = input.required<EvalResult[]>();

    public readonly selectedResultsOut = output<EvalResult[]>();

    public readonly isInSelectionMode = signal<boolean>(false);
    public getChildResultsOfResult = getChildResultsOfResult;
    public readonly results = this.store.selectSignal(selectEvalResults);
    public readonly resultsValues = computed(() =>
        Object.values(this.results())
    );
    public readonly evalCriteria = this.store.selectSignal(selectEvalCriteria);
    public readonly subTables = signal<subTable[]>([]);

    public readonly subTablesMapCache = signal<{ [tableId: UUID]: subTable }>(
        {}
    );
    public readonly subTablesByIndex = signal<{ [index: number]: subTable }>(
        {}
    );
    public readonly selectedResults = signal<{
        [criterionId: EvalCriterionId]: boolean;
    }>({});

    ngOnInit(): void {
        this.isInSelectionMode.set(this.isInSelectionModeInput());
        this.updateSubTables();
        /* initializing selected results */
        const results = Object.values(this.results());
        this.selectedResults.update((obj) => {
            results.forEach((res) => (obj[res.criterionId] = false));
            return obj;
        });
    }
    constructor() {
        effect(async () => {
            this.updateSubTables();
            this.isInSelectionMode.set(this.isInSelectionModeInput());
            if (this.isInSelectionMode()) {
                this.selectedResultsOut.emit(
                    this.rootResults().filter(
                        (res) => this.selectedResults()[res.criterionId]
                    )
                );
                console.log('emitting selected subResults.');
            }
        });
    }

    public emitSelectedSubResults() {
        if (this.isInSelectionMode()) {
            this.selectedResultsOut.emit(
                this.rootResults().filter(
                    (res) => this.selectedResults()[res.criterionId]
                )
            );
            console.log('emitting selected subResults.');
        }
    }

    public async updateSubTables() {
        const rootResults = this.rootResults();
        const resultsLength = rootResults.length;
        let runningIndex = 0;
        /* filling cache with subTables */
        for (let i = 0; i < resultsLength; i += 1) {
            const result = rootResults[i]!;
            this.getSubTablesByResult(
                this.subTablesMapCache,
                result,
                runningIndex
            );
            runningIndex += getEvalCriterionTreeDepth(
                result.criterion,
                this.evalCriteria()
            );
        }

        const subTablesByIndex = this.subTablesByIndex();
        const subTablesLength = Object.values(subTablesByIndex).length;
        let subTableUpdate: subTable[] = [];
        for (let i = 0; i < subTablesLength; i += 1) {
            subTableUpdate = [...subTableUpdate, subTablesByIndex[i]!];
        }
        this.subTables.set(subTableUpdate);
    }

    /**
     * Recursively fills the cache with all subTables from the tree of results
     * @param cache This is the cache for subTables
     * @param result the root result
     * @param runningIndex this gives the index of the SubTable in the results table
     * @param parentId the Id of the parent SubTable
     */
    public getSubTablesByResult(
        cache: WritableSignal<{
            [tableId: string]: subTable;
        }>,
        result: EvalResult,
        runningIndex: number,
        parentId?: UUID
    ) {
        const crit = result.criterion;
        console.log(crit ? 'found crit' : 'crit not found');
        const critType = crit.criterionType;
        let subResults: EvalResult[] = [];
        if (
            critType === 'andEvalCriterion' ||
            critType === 'orEvalCriterion' ||
            critType === 'countCompletedEvalCriterion'
        ) {
            subResults = crit.children.map(
                (childId) => this.results()[childId]!
            );
        }
        if (
            critType === 'firstTrueAtEvalCriterion' ||
            critType === 'notEvalCriterion'
        ) {
            subResults = [this.results()[crit.child]!];
        }
        if (critType === 'compareEvalCriterion') {
            subResults = [
                this.results()[crit.leftChild]!,
                this.results()[crit.rightChild]!,
            ];
        }
        const id = uuid();
        cache.update((obj) => {
            obj[id] = {
                id: id,
                result: result,
                index: runningIndex,
                subResults: subResults,
                subTables: [],
                localIndent: 0,
                indentOffset: [],
                badgeOffset: this.getOffset(this.globalDepth() - 1),
            } as subTable;
            if (parentId) {
                let parent = obj[parentId]!;
                parent.subTables.push(id);
                const newIndent = parent.localIndent + 1;
                obj[id].localIndent = newIndent;
                obj[id].badgeOffset = this.getOffset(
                    this.globalDepth() - newIndent
                );
                obj[id].indentOffset = this.getOffset(newIndent);
            }
            return obj;
        });
        this.subTablesByIndex.update((obj) => {
            obj[runningIndex] = cache()[id]!;
            return obj;
        });
        subResults.forEach((res) =>
            this.getSubTablesByResult(cache, res, runningIndex + 1, id)
        );
    }
    public getSubTablesByIndex(cache: { [tableId: UUID]: subTable }) {
        return Object.values(cache).reduce<{
            [index: number]: subTable;
        }>((obj, subTable) => {
            obj[subTable.index] = subTable;
            return obj;
        }, {});
    }
    /* the default of 590 fits nicely into a card with width 600 */
    public readonly tableMinWidth = input<number>(590);

    public isCombinedEvalCriterion = isCombinedEvalCriterion;
    public getEvalCriterionTreeDepth = getEvalCriterionTreeDepth;
    public readonly globalDepth = computed(() =>
        Math.max(
            ...this.rootResults().map((res) =>
                getEvalCriterionTreeDepth(res.criterion, this.evalCriteria())
            )
        )
    );
    /**
     * This allows for a for-loop in the template.
     * @param length the length of the array
     * @returns returns an array of the specified length.
     */
    private getOffset(length: number) {
        let ret = [] as boolean[];
        for (let i = 0; i < length; i += 1) {
            ret = [...ret, true];
        }
        return ret;
    }

    public toggleSelectResult(result: EvalResult) {
        console.log('toggling selected result');
        this.selectedResults.update((obj) => {
            if (obj[result.criterionId]) {
                obj[result.criterionId] = false;
            } else {
                obj[result.criterionId] = true;
            }
            return obj;
        });
    }

    public toggleIsInSelectionMode() {
        this.isInSelectionMode.set(!this.isInSelectionMode());
    }
}
