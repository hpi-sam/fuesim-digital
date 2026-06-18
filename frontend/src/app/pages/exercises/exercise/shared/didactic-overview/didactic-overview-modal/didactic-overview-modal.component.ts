import { Component, computed, inject, signal } from '@angular/core';
import {
    NgbActiveModal,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    selectEvalCriteria,
    selectEvalResults,
    selectTechnicalChallenges,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../../state/app.state';
import { EvalCriterionCreationForm } from '../eval-criterion-creation-form/eval-criterion-creation-form.component';
import {
    boolEvalCritrionTypes,
    numberEvalCriterionTypes,
    combinedEvalCriterionTypes,
    evalCriterionTypesNames,
    getNumFromEvalCriterion,
    getRootCriteriaMap,
    EvalCriterionCategory,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
import {
    type TechnicalChallengeId,
    type TechnicalChallengeStateId,
    getNumFromEvalResult,
    isTemporalEvalCriterionType,
    statusNames,
} from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
@Component({
    selector: 'app-didactic-overview',
    templateUrl: './didactic-overview-modal.component.html',
    styleUrls: ['./didactic-overview-modal.component.scss'],
    imports: [
        EvalCriterionCreationForm,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
    ],
})
export class DidacticOverviewModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    public readonly rootCriteriaMap = computed(() =>
        this.getRootCriteriaMap(this.store.selectSignal(selectEvalCriteria)())
    );
    public readonly results = computed(() =>
        Object.values(this.store.selectSignal(selectEvalResults)()).map(
            (res) => {
                if (isTemporalEvalCriterionType(res.criterion.criterionType)) {
                    const cacheHit =
                        this.exerciseService.evalResultsCache()[
                            res.criterionId
                        ];
                    return cacheHit ?? res;
                }
                return res;
            }
        )
    );
    public readonly rootResults = computed(() =>
        this.results().filter((res) => this.rootCriteriaMap()[res.criterionId])
    );
    public readonly completedCriteriaCount = computed(() => {
        if (this.results()) {
            let count = 0;
            for (let i = 0; i < this.results().length; i += 1) {
                const res = this.results().at(i);
                if (res?.type === 'boolEvalResult' && res?.isCompleted) {
                    count += 1;
                }
            }
            return count;
        }
        return 0;
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
        const tc = this.technicalChallenges()
            .filter((tc) => tc.id === tcId)
            .at(0);
        return tc?.states[stateId]?.title;
    }
    public getNumFromEvalResult = getNumFromEvalResult;
    public getNumFromEvalCriterion = getNumFromEvalCriterion;
    public getRootCriteriaMap = getRootCriteriaMap;
    public close() {
        this.activeModal.close();
    }
}
