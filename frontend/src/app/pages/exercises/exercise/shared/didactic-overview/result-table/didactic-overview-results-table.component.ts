import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnInit,
    output,
    signal,
} from '@angular/core';
import {
    EvalResult,
    getChildResultsOfResult,
    getEvalCriterionTreeDepth,
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
import { SubTable, updateSubTables } from './sub-table';

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
    /** the default of 590 fits nicely into a card with width 600 */
    public readonly tableMinWidth = input<number>(590);

    public readonly selectedResultsOut = output<EvalResult[]>();

    public readonly isInSelectionMode = signal<boolean>(false);
    public getChildResultsOfResult = getChildResultsOfResult;
    public readonly results = this.store.selectSignal(selectEvalResults);
    public readonly resultsValues = computed(() =>
        Object.values(this.results())
    );
    public readonly evalCriteria = this.store.selectSignal(selectEvalCriteria);
    public readonly subTables = signal<SubTable[]>([]);
    public readonly subTablesByIndex = signal<{ [index: number]: SubTable }>(
        {}
    );
    public readonly globalMaxDepth = computed(() =>
        Math.max(
            ...this.rootResults().map((res) =>
                getEvalCriterionTreeDepth(res.criterion, this.evalCriteria())
            )
        )
    );
    public readonly selectedResults = signal<{
        [criterionId: UUID]: boolean;
    }>({});

    async ngOnInit(): Promise<void> {
        this.isInSelectionMode.set(this.isInSelectionModeInput());
        /* await this.updateSubTables(); */
        /* initializing selected results */
        const results = Object.values(this.results());
        this.selectedResults.update((obj) => {
            results.forEach((res) => (obj[res.criterionId] = false));
            return obj;
        });
    }
    constructor() {
        effect(async () => {
            await updateSubTables(
                this.rootResults(),
                this.evalCriteria(),
                this.results(),
                this.globalMaxDepth(),
                this.subTablesByIndex,
                this.subTables
            );
            this.isInSelectionMode.set(this.isInSelectionModeInput());
            if (this.isInSelectionMode()) {
                this.emitSelectedSubResults();
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
