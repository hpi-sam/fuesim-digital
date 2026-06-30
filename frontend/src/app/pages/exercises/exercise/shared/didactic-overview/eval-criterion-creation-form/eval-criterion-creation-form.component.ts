import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
    type Patient,
    type PatientStatus,
    patientStatusAllowedValues,
    statusNames,
    type UUID,
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
import {
    boolEvalCritrionTypes,
    combinedEvalCriterionTypes,
    EvalCriterionCategory,
    type EvalCriterionType,
    evalCriterionTypesNames,
    numberEvalCriterionTypes,
    evalCriterionCategoryNames,
    EvalCriterion,
    newXPatientsAtStatusEvalCriterion,
    newReachTechnicalChallengeStateEvalCriterion,
    newPatientAtStatusEvalCriterion,
    EvalCriterionId,
    newAndEvalCriterion,
    BoolEvalCriterion,
    BoolEvalCriterionId,
    isBoolEvalCriterion,
    boolEvalCriterionIdSchema,
} from '../../../../../../../../../shared/dist/models/eval-criterion';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';
import { AppState } from '../../../../../../state/app.state';
import {
    selectEvalCriteria,
    selectTechnicalChallenges,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { PatientAtSKCriterionComponent } from './patient-at-sk-criterion/patient-at-sk-criterion.component';
import { InputData } from './utils/input-data';
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
export class EvalCriterionCreationFormComponent {
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
    public readonly criterionCreationType = signal<EvalCriterionType | null>(
        null
    );
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;

    /* TODO @JohannesPotzi : prune this for sub criteria selection to prevent circular input. */
    public readonly evalCriteria = computed(() =>
        Object.values(this.store.selectSignal(selectEvalCriteria)())
    );

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
    readonly selectedPatientStatusMap = signal<{
        [id: UUID]: PatientStatus;
    }>({});

    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    public countInput: number | null = null;
    public nameInput: string | null = null;
    readonly inputModel = signal<InputData>({
        name: '',
        countInput: 0,
        targetPatients: [],
        patientStatusInput: 'black',
        patientTargetStatusMap: {},
        technicalChallengeId: '',
        targetTechnicalChallengeState: '',
        subCriteria: [],
    });
    criterionForm = form(this.inputModel);
    public addPatients(patients: Patient[]) {
        const tmpPatients = patients.filter(
            (pat) => !this.criterionForm.targetPatients().value().includes(pat)
        );
        this.criterionForm
            .targetPatients()
            .value.update((vals) => [...vals, ...tmpPatients]);
    }
    public updateSelectedPatientStatusMapEntry(
        id: UUID,
        status: PatientStatus | null
    ) {
        if (
            !this.criterionForm
                .targetPatients()
                .value()
                .some((pat) => pat.id === id)
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
    public readonly selectableSubCriteria = computed(() => {
        this.evalCriteria().filter((crit) => isBoolEvalCriterion(crit));
    });

    public updateSelectedSubCriteria(
        newCriterion: EvalCriterion | null,
        index: number
    ) {
        this.criterionForm.subCriteria().value.update((value) => {
            value[index] = newCriterion;
            return value;
        });
    }
    private async createCriteria(criteria: EvalCriterion[]) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterions',
            criterions: criteria,
        });
    }
    public submitCriterion() {
        const criterionType = this.criterionCreationType();
        const criterionCategory = this.criterionCreationCategory();
        if (criterionCategory === 'combinedEvalCriterion') {
            /* TODO @JohannesPotzi @Jogius : implements for all combined criteria types*/
            const criterion = newAndEvalCriterion(
                'new AND eval crit',
                this.criterionForm
                    .subCriteria()
                    .value()
                    .reduce<BoolEvalCriterionId[]>((obj, entry) => {
                        if (entry && isBoolEvalCriterion(entry)) {
                            obj = [...obj, entry.id as BoolEvalCriterionId];
                        }
                        return obj;
                    }, [])
            );
            this.createCriteria([criterion]);
        }
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
                        const status =
                            this.selectedPatientStatusMap()[pat.id] ?? 'black';
                        return newPatientAtStatusEvalCriterion(
                            `Patient ${pat.identifier} erreicht Status ${
                                statusNames[status]
                            }`,
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
            case 'countCompletedEvalCriterion': {
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
