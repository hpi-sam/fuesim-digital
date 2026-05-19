import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    PatientStatus,
    patientStatusAllowedValues,
    statusNames,
    TechnicalChallenge,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
} from 'fuesim-digital-shared';
import {
    EvalCriterion,
    type EvalcriterionType,
    evalCriterionTypesNames,
    newReachTechnicalChallengeStateEvalCriterion,
    newXPatientsAtStatusEvalCriterion,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectTechnicalChallenges } from '../../../../../../state/application/selectors/exercise.selectors';
import { PatientAtSKCriterionComponent } from './patient-at-sk-criterion/patient-at-sk-criterion.component';

interface InputData {
    countInput: number;
    patientStatusInput: PatientStatus;
    technicalChallengeId: TechnicalChallengeId | '';
    targetTechnicalChallengeState: TechnicalChallengeStateId | '';
}
@Component({
    selector: 'app-eval-criterion-creation-form',
    templateUrl: './eval-criterion-creation-form.component.html',
    styleUrls: ['./eval-criterion-creation-form.component.scss'],
    imports: [
        FormField,
        FormsModule,
        AppSaveOnTypingDirective,
        PatientAtSKCriterionComponent,
    ],
})
export class EvalCriterionCreationForm {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly technicalChalleges = this.store.selectSignal(
        selectTechnicalChallenges
    );
    public readonly technicalChallengesValues = signal(
        Object.values(this.technicalChalleges())
    );
    public readonly selectedTechnicalChallenge =
        signal<TechnicalChallenge | null>(null);
    public readonly selectedTechnicalChallengeStates = computed(() => {
        if (this.criterionForm.technicalChallengeId().value() !== '') {
            const id = this.criterionForm.technicalChallengeId().value();
            const tc =
                this.technicalChallengesValues().filter(
                    (tc) => tc.id === id
                )[0] ?? null;
            return Object.values(tc!.states);
        }
        return null;
    });

    public readonly criterionCreationType = input.required<EvalcriterionType>();
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    public countInput: number | null = null;
    readonly inputModel = signal<InputData>({
        countInput: 0,
        patientStatusInput: 'black',
        technicalChallengeId: '',
        targetTechnicalChallengeState: '',
    });
    criterionForm = form(this.inputModel);
    private async createCriterions(criterions: EvalCriterion[]) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterions',
            criterions: criterions,
        });
    }
    public submitCriterion(criterionType: EvalcriterionType) {
        switch (criterionType) {
            case 'xPatientsAtStatusEvalCriterion': {
                const criterion = newXPatientsAtStatusEvalCriterion(
                    'Patienten mit Sichtungskategorie',
                    this.criterionForm.countInput().value(),
                    this.criterionForm.patientStatusInput().value()
                );
                this.createCriterions([criterion]);
                break;
            }
            case 'reachTechnicalChallengeStateEvalCriterion': {
                const stateId = this.criterionForm
                    .targetTechnicalChallengeState()
                    .value();
                if (stateId !== '') {
                    const criterion =
                        newReachTechnicalChallengeStateEvalCriterion(
                            'Technische Herausforderung mit Zustand',
                            this.selectedTechnicalChallenge()!.id,
                            stateId
                        );
                    this.createCriterions([criterion]);
                }
                break;
            }
            default:
                break;
        }
    }
}
