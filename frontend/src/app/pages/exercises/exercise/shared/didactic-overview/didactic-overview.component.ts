import { Component, computed, inject, input, signal } from '@angular/core';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    boolEvalCritrionTypes,
    numberEvalCriterionTypes,
    combinedEvalCriterionTypes,
    evalCriterionTypesNames,
    getNumFromEvalCriterion,
    getRootCriteriaMap,
    type EvalCriterionCategory,
    type EvalCriterionId,
    type EvalResult,
    type TechnicalChallengeId,
    type TechnicalChallengeStateId,
    getNumFromEvalResult,
    isTemporalEvalCriterionType,
    statusNames,
} from 'fuesim-digital-shared';
import {
    selectEvalCriteria,
    selectEvalResults,
    selectTechnicalChallenges,
} from '../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../state/app.state';
import { EvalCriterionCreationFormComponent } from './eval-criterion-creation-form/eval-criterion-creation-form.component';
import { ExerciseService } from '../../../../../core/exercise.service';
import { EvalResultStatusBadgeComponent } from './result-status-badge/eval-result-status-badge.component';

@Component({
    selector: 'app-didactic-overview',
    templateUrl: './didactic-overview.component.html',
    styleUrls: ['./didactic-overview.component.scss'],
    imports: [
        EvalCriterionCreationFormComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        EvalResultStatusBadgeComponent,
    ],
})
export class DidacticOverviewComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    public readonly resultsCache = this.exerciseService.evalResultsCache;

    public readonly tableWidth = input.required<number>();
    public readonly enableCriterionCreation = input<boolean>(true);

    public readonly rootCriteriaMap = computed(() =>
        this.getRootCriteriaMap(this.store.selectSignal(selectEvalCriteria)())
    );
    public readonly results = computed(() =>
        Object.values(this.store.selectSignal(selectEvalResults)()).map(
            (res) => {
                if (isTemporalEvalCriterionType(res.criterion.criterionType)) {
                    const cacheHit = this.resultsCache()[res.criterionId];
                    return cacheHit ?? res;
                }
                return res;
            }
        )
    );
    public readonly resultsMap = computed(() =>
        this.results().reduce<{ [crieterionId: EvalCriterionId]: EvalResult }>(
            (mapObject, result) => {
                mapObject[result.criterionId] = result;
                return mapObject;
            },
            {}
        )
    );
    public readonly rootResults = computed(() =>
        this.results().filter((res) => this.rootCriteriaMap()[res.criterionId])
    );
    public readonly completedCriteriaCount = computed(() => {
        const results = this.results();
        let count = 0;
        for (let i = 0; i < results.length; i += 1) {
            const res = results.at(i);
            if (res?.type === 'boolEvalResult' && res.isCompleted) {
                count += 1;
            }
        }
        return count;
    });
    private readonly tcs = this.store.selectSignal(selectTechnicalChallenges);
    public readonly technicalChallenges = signal(Object.values(this.tcs()));
    creatingcriterion = false;
    public readonly boolEvalCriterionTypes = boolEvalCritrionTypes;
    public readonly numberEvalCriterionTypes = numberEvalCriterionTypes;
    public readonly combinedEvalCriterionTypes = combinedEvalCriterionTypes;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly statusNames = statusNames;
    /* this is set on selection of the criterion category to be created. */
    public readonly criterionCreationCategory =
        signal<EvalCriterionCategory | null>(null);
    public setCriterionCreationCategory(category: EvalCriterionCategory) {
        this.criterionCreationCategory.set(category);
    }
    public getTechnicalChallengeNamebyId(id: TechnicalChallengeId) {
        return this.technicalChallenges()
            .filter((tc) => tc.id === id)
            .at(0)?.name;
    }
    public getTechnicalChallengeStateTitlebyId(
        tcId: TechnicalChallengeId,
        stateId: TechnicalChallengeStateId
    ) {
        const tcWithId = this.technicalChallenges()
            .filter((tc) => tc.id === tcId)
            .at(0);
        return tcWithId?.states[stateId]?.title;
    }
    public getNumFromEvalResult = getNumFromEvalResult;
    public getNumFromEvalCriterion = getNumFromEvalCriterion;
    public getRootCriteriaMap = getRootCriteriaMap;
}
