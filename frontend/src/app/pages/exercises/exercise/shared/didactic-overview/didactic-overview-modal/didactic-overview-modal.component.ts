import { Component, effect, inject, signal } from '@angular/core';
import {
    NgbActiveModal,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { selectEvalResults } from '../../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../../state/app.state';
import { EvalCriterionCreationForm } from '../eval-criterion-creation-form/eval-criterion-creation-form.component';
import {
    type EvalcriterionType,
    evalCritrionTypes,
    evalCriterionTypesNames,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
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
    public readonly results = this.store.selectSignal(selectEvalResults);
    public readonly resultValues = signal(Object.values(this.results()));
    updatesCount = 0;
    creatingcriterion = false;
    public readonly evalCriterionTypes = evalCritrionTypes;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    /* this is set on selection of the criterion type to be created. */
    criterionCreationType!: EvalcriterionType;
    constructor() {
        effect(() => {
            if (this.results()) {
                this.resultValues.set(Object.values(this.results()));
                this.updatesCount += 1;
            }
        });
    }
    public close() {
        this.activeModal.close();
    }
}
