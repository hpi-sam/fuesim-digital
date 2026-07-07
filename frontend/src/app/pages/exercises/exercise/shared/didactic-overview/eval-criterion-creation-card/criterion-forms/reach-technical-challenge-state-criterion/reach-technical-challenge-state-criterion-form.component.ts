import {
    Component,
    computed,
    effect,
    inject,
    output,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
} from 'fuesim-digital-shared';
import { AppState } from '../../../../../../../../state/app.state';
import { selectTechnicalChallenges } from '../../../../../../../../state/application/selectors/exercise.selectors';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

interface LocalInputData {
    technicalChallengeId: TechnicalChallengeId | '';
    targetTechnicalChallengeState: TechnicalChallengeStateId | '';
}

@Component({
    selector: 'app-reach-technical-challenge-state-criterion-form',
    templateUrl:
        './reach-technical-challenge-state-criterion-form.component.html',
    styleUrls: [
        './reach-technical-challenge-state-criterion-form.component.scss',
    ],
    imports: [FormField, FormsModule],
})
export class ReachTechnicalChallengeStateEvalCriterionFormComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly technicalChallengeIdOut = output<
        TechnicalChallengeId | ''
    >();
    public readonly targetTechnicalChallengeStateOut = output<
        TechnicalChallengeStateId | ''
    >();

    readonly inputModel = signal<LocalInputData>({
        technicalChallengeId: '',
        targetTechnicalChallengeState: '',
    });
    criterionForm = form(this.inputModel);

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    constructor() {
        effect(() => {
            this.technicalChallengeIdOut.emit(
                this.criterionForm.technicalChallengeId().value()
            );
            this.targetTechnicalChallengeStateOut.emit(
                this.criterionForm.targetTechnicalChallengeState().value()
            );
        });
    }

    private readonly tcs = this.store.selectSignal(selectTechnicalChallenges);
    public readonly technicalChallenges = signal(Object.values(this.tcs()));

    public readonly selectedTechnicalChallengeStates = computed(() => {
        if (this.criterionForm.technicalChallengeId().value() !== '') {
            const id = this.criterionForm.technicalChallengeId().value();
            const tcWithId =
                this.technicalChallenges().filter((tc) => tc.id === id)[0] ??
                null;
            return Object.values(tcWithId!.states);
        }
        return null;
    });
}
