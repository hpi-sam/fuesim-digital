import {
    Component,
    computed,
    effect,
    inject,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core';
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
    createSelectEvalCriterion,
    selectEvalResults,
    selectTechnicalChallenges,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../../state/app.state';
import { EvalCriterionCreationForm } from '../eval-criterion-creation-form/eval-criterion-creation-form.component';
import {
    type EvalcriterionType,
    evalCritrionTypes,
    evalCriterionTypesNames,
    XPatientsAtStatusEvalCriterion,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
import {
    type EvalResult,
    Patient,
    TechnicalChallenge,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
    type UUID,
    statusNames,
} from 'fuesim-digital-shared';
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
    public readonly results = computed(() =>
        Object.values(this.store.selectSignal(selectEvalResults)())
    );
    public readonly completedCriteriaCount = computed(() => {
        let count = 0;
        for (let i = 0; i < this.results().length; i += 1) {
            if (this.results().at(i)?.isCompleted) count += 1;
        }
        return count;
    });
    private readonly tcs = this.store.selectSignal(selectTechnicalChallenges);
    public readonly technicalChallenges = signal(Object.values(this.tcs()));
    creatingcriterion = false;
    public readonly evalCriterionTypes = evalCritrionTypes;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly statusNames = statusNames;
    /* this is set on selection of the criterion type to be created. */
    criterionCreationType!: EvalcriterionType;
    getTypedCriterion(id: UUID) {
        return this.store.selectSignal(
            createSelectEvalCriterion(id)
        )() as XPatientsAtStatusEvalCriterion;
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
    public close() {
        this.activeModal.close();
    }
}
