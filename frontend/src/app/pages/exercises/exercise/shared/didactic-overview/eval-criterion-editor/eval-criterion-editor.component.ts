import { Component, computed, inject, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
    statusNames,
    combinedEvalCriterionTypes,
    type EvalCriterionCategory,
    type EvalCriterionType,
    evalCriterionTypesNames,
    numberEvalCriterionTypes,
    evalCriterionCategoryNames,
    type EvalCriterion,
    newReachTechnicalChallengeStateEvalCriterion,
    newPatientAtStatusEvalCriterion,
    newAndEvalCriterion,
    isBoolEvalCriterion,
    type UUID,
    newViewScoutableEvalCriterion,
    boolEvalCriterionLeafTypes,
    newCountCompletedEvalCriterion,
    newOrEvalCriterion,
    newCountPatientsAtStatusEvalCriterion,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { AppState } from '../../../../../../state/app.state';
import { selectEvalCriteria } from '../../../../../../state/application/selectors/exercise.selectors';
import { type InputData } from './input-data';
import { EvalCriterionFormsComponent } from './criterion-forms/criterion-forms.component';
@Component({
    selector: 'app-eval-criterion-editor',
    templateUrl: './eval-criterion-editor.component.html',
    styleUrls: ['./eval-criterion-editor.component.scss'],
    imports: [
        FormsModule,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        EvalCriterionFormsComponent,
    ],
})
/* TODO @JohannesPotzi : Make this indepentent of the didactic overview component. */
export class EvalCriterionCreationCardComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    //for the dropdowns to select the critrerion creation type
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly boolEvalCriterionLeafTypes = boolEvalCriterionLeafTypes;
    public readonly numberEvalCriterionTypes = numberEvalCriterionTypes;
    public readonly combinedEvalCriterionTypes = combinedEvalCriterionTypes;

    public readonly criterionCreationCategory =
        signal<EvalCriterionCategory | null>(null);

    public readonly criterionCreationType = signal<EvalCriterionType | null>(
        null
    );

    /* TODO @JohannesPotzi : prune this for sub criteria selection to prevent circular input. */
    public readonly evalCriteria = computed(() =>
        Object.values(this.store.selectSignal(selectEvalCriteria)())
    );

    public countInput: number | null = null;
    public nameInput: string | null = null;
    readonly inputModel = signal<InputData>({
        name: '',
        countInput: 0,
        timestampInput: 0,
        patientStatusInput: 'black',
        technicalChallengeId: '',
        targetStateMachineIds: [],
        targetStateMachineStateIds: {},
        targetPatients: [],
        targetPatientsStatusMap: {},
        targetScoutableId: '',
        subCriteria: [],
        singleSubCriterion: '',
    });
    criterionForm = form(this.inputModel);

    private async createCriteria(criteria: EvalCriterion[]) {
        if (criteria.length < 1) {
            console.log('ERROR: Trying to create 0 criteria in creation card.');
            return;
        }
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criteria',
            criteria: criteria,
        });
    }
    public submitCriterion() {
        const name =
            this.criterionForm.name().value() !== ''
                ? this.criterionForm.name().value()
                : null;
        let criteria: EvalCriterion[] = [];
        switch (this.criterionCreationType()) {
            case 'reachTechnicalChallengeStateEvalCriterion': {
                const machineIds = this.criterionForm
                    .targetStateMachineIds()
                    .value();
                const stateIds = this.criterionForm
                    .targetStateMachineStateIds()
                    .value();
                if (machineIds.length > 0) {
                    const technicalChallengeId =
                        this.criterionForm.technicalChallengeId().value() !== ''
                            ? this.criterionForm.technicalChallengeId().value()
                            : null;

                    const criterion = technicalChallengeId
                        ? newReachTechnicalChallengeStateEvalCriterion(
                              this.criterionForm.name().value(),
                              technicalChallengeId,
                              machineIds,
                              stateIds
                          )
                        : null;
                    if (criterion) criteria = [criterion];
                }
                break;
            }
            case 'patientAtStatusEvalCriterion': {
                criteria = this.criterionForm
                    .targetPatients()
                    .value()
                    .map((pat) => {
                        const status =
                            this.criterionForm
                                .targetPatientsStatusMap()
                                .value()[pat.id] ?? 'black';
                        const name = this.criterionForm.name().value();
                        return newPatientAtStatusEvalCriterion(
                            name === ''
                                ? `Patient ${pat.identifier} erreicht Status ${
                                      statusNames[status]
                                  }`
                                : name,
                            pat.id,
                            status
                        );
                    });
                break;
            }
            case 'viewScoutableEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                const targetScoutableId = this.criterionForm
                    .targetScoutableId()
                    .value();

                const criterion = targetScoutableId
                    ? newViewScoutableEvalCriterion(
                          name ?? 'Erkunde',
                          targetScoutableId
                      )
                    : null;
                if (criterion) criteria = [criterion];
                break;
            }
            case 'countPatientsAtStatusEvalCriterion': {
                const criterion = newCountPatientsAtStatusEvalCriterion(
                    name ?? '',
                    this.criterionForm.patientStatusInput().value()
                );
                criteria = [criterion];
                break;
            }
            case 'countMeasuresEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'constNumEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'timestampEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'firstTrueAtEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'compareEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'notEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'andEvalCriterion': {
                const criterion = newAndEvalCriterion(
                    this.criterionForm.name().value(),
                    this.criterionForm
                        .subCriteria()
                        .value()
                        .filter((crit) => isBoolEvalCriterion(crit))
                        .map((crit) => crit.id as UUID)
                );
                if (criterion) criteria = [criterion];
                break;
            }
            case 'countCompletedEvalCriterion': {
                const criterion = newCountCompletedEvalCriterion(
                    this.criterionForm.name().value(),
                    this.criterionForm
                        .subCriteria()
                        .value()
                        .filter((crit) => isBoolEvalCriterion(crit))
                        .map((crit) => crit.id as UUID)
                );
                if (criterion) criteria = [criterion];
                break;
            }
            case 'orEvalCriterion': {
                const criterion = newOrEvalCriterion(
                    this.criterionForm.name().value(),
                    this.criterionForm
                        .subCriteria()
                        .value()
                        .filter((crit) => isBoolEvalCriterion(crit))
                        .map((crit) => crit.id as UUID)
                );
                if (criterion) criteria = [criterion];
                break;
            }
            default:
                break;
        }
        this.createCriteria(criteria);
    }
}
