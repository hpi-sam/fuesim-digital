import {
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
    EvalResult,
    getEvalResultFromCriterion,
    getEvalResultsFromCriteria,
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
    newReachTechnicalChallengeStateEvalCriterion,
    newPatientAtStatusEvalCriterion,
    newAndEvalCriterion,
    BoolEvalCriterionId,
    isBoolEvalCriterion,
    EvalCriterionId,
    newViewScoutableEvalCriterion,
    boolEvalCriterionLeafTypes,
    newCountCompletedEvalCriterion,
    newOrEvalCriterion,
} from '../../../../../../../../../shared/dist/models/eval-criterion';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';
import { AppState } from '../../../../../../state/app.state';
import {
    selectCurrentTime,
    selectDraftEvalResults,
    selectEvalCriteria,
    selectPatients,
    selectScoutables,
    selectTechnicalChallenges,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { PatientAtStatusCriterionComponent } from './criterion-forms/patient-at-status-criterion/patient-at-status-criterion.component';
import { InputData } from './input-data';
import { ReachTechnicalChallengeStateEvalCriterionFormComponent } from './criterion-forms/reach-technical-challenge-state-criterion/reach-technical-challenge-state-criterion-form.component';
import { ViewScoutableEvalCriterionFormComponent } from './criterion-forms/view-scoutable-criterion/view-scoutable-criterion-form.component';
import { DidacticOverViewResultsTableComponent } from '../result-table/didactic-overview-results-table.component';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-eval-criterion-creation-card',
    templateUrl: './eval-criterion-creation-card.component.html',
    styleUrls: ['./eval-criterion-creation-card.component.scss'],
    imports: [
        FormField,
        FormsModule,
        AppSaveOnTypingDirective,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        PatientAtStatusCriterionComponent,
        ReachTechnicalChallengeStateEvalCriterionFormComponent,
        ViewScoutableEvalCriterionFormComponent,
        DidacticOverViewResultsTableComponent,
    ],
})
export class EvalCriterionCreationCardComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly tickSubscribtion: Subscription | null = null;
    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    public readonly boolEvalCriterionLeafTypes = boolEvalCriterionLeafTypes;
    public readonly numberEvalCriterionTypes = numberEvalCriterionTypes;
    public readonly combinedEvalCriterionTypes = combinedEvalCriterionTypes;

    public readonly selectedSubResultsIn = input.required<EvalResult[]>();

    public readonly draftEvalResults = computed(() =>
        Object.values(this.store.selectSignal(selectDraftEvalResults)())
    );

    constructor() {
        /* TODO @JohannesPotzi : instead do this: add a draft marker to eval criteria in the state.
        Also add an input option to the results table to only show draft results. Default is no drafts are shown.
        Also create criatia as draft when added to the shopping cart.
            Also edit as non draft on submit.
            Also delete draft criteria Action when criteria creation mode is ended in the overview.  */
        const sub = this.exerciseService.mostRecentAtion.subscribe((action) => {
            if (action.type === '[Exercise] Tick') {
                const shoppingCart = Object.values(this.criteriaShoppingCart());
                const cache: { [key: string]: EvalResult } = {};
                console.log('Hello! ' + shoppingCart);
                this.shoppingCartResults.set(
                    shoppingCart.map((crit) =>
                        this.shortCriterionToResult(crit, cache)
                    )
                );
            }
        });
        this.tickSubscribtion = sub;
        effect(() => {
            this.criterionForm
                .subCriteria()
                .value.set([
                    ...this.selectedSubResultsIn().map((res) => res.criterion),
                    ...this.selectedTempSubResults().map(
                        (res) => res.criterion
                    ),
                ]);
            this.areResultsTablesInSelectionModeOut.emit(
                this.areResultsTablesInSelectionMode()
            );
        });
    }

    public readonly areResultsTablesInSelectionMode = computed(() => {
        return this.criterionCreationCategory() === 'combinedEvalCriterion';
    });
    public readonly areResultsTablesInSelectionModeOut = output<boolean>();
    public readonly criterionCreationCategory =
        signal<EvalCriterionCategory | null>(null);

    public readonly criterionCreationType = signal<EvalCriterionType | null>(
        null
    );
    public readonly criterionCreationTypeName = computed(() => {
        const selectedType = this.criterionCreationType();
        return selectedType ? this.evalCriterionTypesNames[selectedType] : '';
    });

    /* TODO @JohannesPotzi : prune this for sub criteria selection to prevent circular input. */
    public readonly evalCriteria = computed(() =>
        Object.values(this.store.selectSignal(selectEvalCriteria)())
    );
    private readonly criteriaShoppingCart = signal<{
        [key: EvalCriterionId]: EvalCriterion;
    }>({});

    public readonly shoppingCartResults = signal<EvalResult[]>([]);
    /* public readonly shoppingCartResults = computed(() => {
        const shoppingCart = Object.values(this.criteriaShoppingCart());
        const criteria = this.store.selectSignal(selectEvalCriteria)();
        const tcs = this.store.selectSignal(selectTechnicalChallenges)();
        const patients = this.store.selectSignal(selectPatients)();
        const scoutables = this.store.selectSignal(selectScoutables)();
        const currentTime = this.store.selectSignal(selectCurrentTime)();
        const cache: { [key: string]: EvalResult } = {};
        console.log(shoppingCart);
        return shoppingCart.map((crit) =>
            getEvalResultFromCriterion(
                crit,
                criteria,
                tcs,
                patients,
                scoutables,
                currentTime,
                cache
            )
        );
    }); */
    public readonly createFurtherCriteraOption = signal<boolean>(false);
    public toggleCreateFurtherCriteraOption() {
        this.createFurtherCriteraOption.set(!this.createFurtherCriteraOption());
    }

    readonly selectedPatientStatusMap = signal<{
        [id: UUID]: PatientStatus;
    }>({});

    public countInput: number | null = null;
    public nameInput: string | null = null;
    readonly inputModel = signal<InputData>({
        name: '',
        countInput: 0,
        timestampInput: 0,
        patientStatusInput: 'black',
        patientTargetStatusMap: {},
        technicalChallengeId: '',
        targetTechnicalChallengeState: '',
        targetPatients: [],
        targetScoutableId: '',
        subCriteria: [],
        singleSubCriterion: '',
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
    public readonly selectedTempSubResults = signal<EvalResult[]>([]);

    private async createCriteria(criteria: EvalCriterion[]) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterions',
            criterions: criteria,
        });
    }
    public addCriteriaToCart(criteria: EvalCriterion[]) {
        this.criteriaShoppingCart.update((cart) => {
            criteria.forEach((crit) => {
                cart[crit.id] = crit;
            });
            return cart;
        });
    }
    public checkoutShoppingCart() {
        this.createCriteria(Object.values(this.criteriaShoppingCart()));
        this.criteriaShoppingCart.set({});
    }
    public submit() {
        this.submitCriterion();
        this.checkoutShoppingCart();
    }
    public submitCriterion(isVisisbleForParticipants?: boolean) {
        const asDraft = this.createFurtherCriteraOption();
        const criterionType = this.criterionCreationType();
        const criterionCategory = this.criterionCreationCategory();
        if (criterionCategory === 'combinedEvalCriterion') {
            /* TODO @JohannesPotzi @Jogius : implements for all combined criteria types*/
        }
        switch (criterionType) {
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
                              this.criterionForm.name().value(),
                              technicalChallengeId,
                              stateId,
                              isVisisbleForParticipants,
                              asDraft
                          )
                        : null;
                    if (criterion) this.addCriteriaToCart([criterion]);
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
                        const name = this.criterionForm.name().value();
                        return newPatientAtStatusEvalCriterion(
                            name === ''
                                ? `Patient ${pat.identifier} erreicht Status ${
                                      statusNames[status]
                                  }`
                                : name,
                            pat.id,
                            status,
                            isVisisbleForParticipants,
                            asDraft
                        );
                    });
                this.addCriteriaToCart(criteria);
                break;
            }
            case 'viewScoutableEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
                const targetScoutableId = this.criterionForm
                    .targetScoutableId()
                    .value();
                let name = this.criterionForm.name().value();
                if (name === '') {
                    name = 'Erkunde';
                }
                const criterion = targetScoutableId
                    ? newViewScoutableEvalCriterion(
                          name,
                          targetScoutableId,
                          isVisisbleForParticipants,
                          asDraft
                      )
                    : null;
                if (criterion) this.addCriteriaToCart([criterion]);
                break;
            }
            case 'countPatientsAtStatusEvalCriterion': {
                /* TODO @JohannesPotzi @Jogius */
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
                        .map((crit) => crit.id as BoolEvalCriterionId),
                    isVisisbleForParticipants,
                    asDraft
                );
                this.addCriteriaToCart([criterion]);
                break;
            }
            case 'countCompletedEvalCriterion': {
                const criterion = newCountCompletedEvalCriterion(
                    this.criterionForm.name().value(),
                    this.criterionForm
                        .subCriteria()
                        .value()
                        .filter((crit) => isBoolEvalCriterion(crit))
                        .map((crit) => crit.id as BoolEvalCriterionId),
                    isVisisbleForParticipants,
                    asDraft
                );
                this.addCriteriaToCart([criterion]);
                break;
            }
            case 'orEvalCriterion': {
                const criterion = newOrEvalCriterion(
                    this.criterionForm.name().value(),
                    this.criterionForm
                        .subCriteria()
                        .value()
                        .filter((crit) => isBoolEvalCriterion(crit))
                        .map((crit) => crit.id as BoolEvalCriterionId),
                    isVisisbleForParticipants,
                    asDraft
                );
                this.addCriteriaToCart([criterion]);
                break;
            }
            default:
                break;
        }
    }

    public shortCriterionToResult(
        criterion: EvalCriterion,
        cache?: { [key: string]: EvalResult }
    ): EvalResult {
        const criteria = this.store.selectSignal(selectEvalCriteria)();
        const tcs = this.store.selectSignal(selectTechnicalChallenges)();
        const patients = this.store.selectSignal(selectPatients)();
        const scoutables = this.store.selectSignal(selectScoutables)();
        const currentTime = this.store.selectSignal(selectCurrentTime)();

        return getEvalResultFromCriterion(
            criterion,
            criteria,
            tcs,
            patients,
            scoutables,
            currentTime,
            cache ?? {}
        );
    }
}
