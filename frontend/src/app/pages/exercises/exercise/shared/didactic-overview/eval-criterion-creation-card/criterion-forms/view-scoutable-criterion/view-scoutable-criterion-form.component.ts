import {
    Component,
    computed,
    effect,
    inject,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import {
    currentStateOf,
    evalCriterionCategoryNames,
    evalCriterionTypesNames,
    Scoutable,
    TechnicalChallenge,
    UUID,
} from 'fuesim-digital-shared';
import { AppState } from '../../../../../../../../state/app.state';
import {
    selectMapImages,
    selectPatients,
    selectTechnicalChallenges,
} from '../../../../../../../../state/application/selectors/exercise.selectors';

interface LocalInputData {
    targetScoutableId: UUID | '';
}

@Component({
    selector: 'app-view-scoutable-criterion-form',
    templateUrl: './view-scoutable-criterion-form.component.html',
    styleUrls: ['./view-scoutable-criterion-form.component.scss'],
    imports: [FormField, FormsModule],
})
export class ViewScoutableEvalCriterionFormComponent {
    private readonly store = inject<Store<AppState>>(Store);
    public readonly targetScoutableIdOut = output<UUID>();
    public readonly patients = computed(() =>
        Object.values(this.store.selectSignal(selectPatients)()).filter(
            (patient) => {
                return patient.scoutableId;
            }
        )
    );
    public readonly mapImages = computed(() =>
        Object.values(this.store.selectSignal(selectMapImages)()).filter(
            (image) => {
                return image.scoutableId;
            }
        )
    );
    public readonly technicalChallenges = computed(() =>
        Object.values(
            this.store.selectSignal(selectTechnicalChallenges)()
        ).filter((tc) => {
            const currentState = currentStateOf(tc);
            return currentState.viewedByParticipants;
        })
    );

    public selectScoutable(id: UUID) {
        this.criterionForm.targetScoutableId().value.set(id);
    }

    readonly inputModel = signal<LocalInputData>({
        targetScoutableId: '',
    });
    criterionForm = form(this.inputModel);

    constructor() {
        effect(() => {
            this.targetScoutableIdOut.emit(
                this.criterionForm.targetScoutableId().value()
            );
        });
    }

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
}
