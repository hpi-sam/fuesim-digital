import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    type Patient,
    type PatientStatus,
    patientStatusAllowedValues,
    statusNames,
    type TechnicalChallengeId,
    type TechnicalChallengeStateId,
    type UUID,
} from 'fuesim-digital-shared';
import {
    boolEvalCritrionTypes,
    combinedEvalCriterionTypes,
    type EvalCriterion,
    EvalCriterionCategory,
    type EvalcriterionType,
    evalCriterionTypesNames,
    newPatientAtStatusEvalCriterion,
    newReachTechnicalChallengeStateEvalCriterion,
    newXPatientsAtStatusEvalCriterion,
    numberEvalCriterionTypes,
    evalCriterionCategoryNames,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectTechnicalChallenges } from '../../../../../../state/application/selectors/exercise.selectors';
import { PatientAtSKCriterionComponent } from './patient-at-sk-criterion/patient-at-sk-criterion.component';
import {
    NgbDropdown,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';

interface InputData {
    countInput: number;
    targetPatients: Patient[];
    patientStatusInput: PatientStatus;
    patientTargetStatusMap: { [id: UUID]: PatientStatus };
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
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
    ],
})
export class EvalCriterionCreationForm {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    public readonly criterionCreationCategory =
        input.required<EvalCriterionCategory>();
    public readonly criterionTypeOptions = computed(() => {
        switch (this.criterionCreationCategory()) {
            case 'boolEvalCriterion': {
                return boolEvalCritrionTypes;
            }
            case 'numberEvalCriterion': {
                return numberEvalCriterionTypes;
            }
            case 'combinedEvalCriterion': {
                return combinedEvalCriterionTypes;
            }
        }
    });
    public readonly criterionCreationType = signal<EvalcriterionType | null>(
        null
    );
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;

    private readonly tcs = this.store.selectSignal(selectTechnicalChallenges);
    public readonly technicalChallenges = signal(Object.values(this.tcs()));
    public readonly selectedTechnicalChallengeStates = computed(() => {
        if (this.criterionForm.technicalChallengeId().value() !== '') {
            const id = this.criterionForm.technicalChallengeId().value();
            const tc =
                this.technicalChallenges().filter((tc) => tc.id === id)[0] ??
                null;
            return Object.values(tc!.states);
        }
        return null;
    });
    readonly selectedPatientStatusMap = signal<{
        [id: UUID]: PatientStatus;
    }>({});

    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    public countInput: number | null = null;
    readonly inputModel = signal<InputData>({
        countInput: 0,
        targetPatients: [],
        patientStatusInput: 'black',
        patientTargetStatusMap: {},
        technicalChallengeId: '',
        targetTechnicalChallengeState: '',
    });
    criterionForm = form(this.inputModel);
    public addPatients(patients: Patient[]) {
        patients = patients.filter(
            (pat) => !this.criterionForm.targetPatients().value().includes(pat)
        );
        this.criterionForm
            .targetPatients()
            .value.update((vals) => [...vals, ...patients]);
    }
    public updateSelectedPatientStatusMapEntry(
        id: UUID,
        status: PatientStatus | null
    ) {
        if (
            !this.criterionForm
                .targetPatients()
                .value()
                .find((pat) => pat.id === id)
        ) {
            console.log(
                'trying to assign a PatientStatus to a Patient not in selection.'
            );
            return;
        }
        if (this.selectedPatientStatusMap()[id] === status) {
            return;
        }
        this.selectedPatientStatusMap.update((val) => {
            if (!status) {
                delete val[id];
            } else {
                val[id] = status;
            }
            return val;
        });
    }
    public updateSelectedPatientStatusMap(mapIn: {
        [id: UUID]: PatientStatus;
    }) {
        const patients = this.criterionForm.targetPatients().value();
        const patientCount = patients.length;
        for (let i = 0; i < patientCount; i += 1) {
            const id = patients[i]!.id;
            const status = mapIn[id];
            if (status) {
                this.updateSelectedPatientStatusMapEntry(id, status);
            }
        }
    }
    private async createCriteria(criteria: EvalCriterion[]) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterions',
            criterions: criteria,
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
                this.createCriteria([criterion]);
                break;
            }
            case 'reachTechnicalChallengeStateEvalCriterion': {
                const stateId = this.criterionForm
                    .targetTechnicalChallengeState()
                    .value();
                if (stateId !== '') {
                    const technicalChallengeId =
                        this.criterionForm.technicalChallengeId().value() !== ''
                            ? this.criterionForm.technicalChallengeId().value()
                            : null;

                    const criterion = technicalChallengeId
                        ? newReachTechnicalChallengeStateEvalCriterion(
                              'TH',
                              technicalChallengeId,
                              stateId
                          )
                        : null;
                    if (criterion) this.createCriteria([criterion]);
                }
                break;
            }
            case 'patientAtStatusEvalCriterion': {
                const criteria = this.criterionForm
                    .targetPatients()
                    .value()
                    .map((pat) => {
                        let status =
                            this.selectedPatientStatusMap()[pat.id] ?? 'black';
                        return newPatientAtStatusEvalCriterion(
                            'Patient ' +
                                pat.identifier +
                                ' erreicht Status ' +
                                statusNames[status],
                            pat.id,
                            status
                        );
                    });
                this.createCriteria(criteria);
                break;
            }
            case 'viewScoutableEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'doMeasureXTimesEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'constNumEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'timeStampEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'firstTrueAtEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'greaterThanEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'notEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'andEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'countEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            case 'orEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                break;
            }
            default:
                break;
        }
    }
}
