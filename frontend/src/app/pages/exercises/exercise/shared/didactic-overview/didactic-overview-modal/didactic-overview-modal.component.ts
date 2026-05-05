import { Component, effect, inject, signal } from '@angular/core';
import {
    NgbActiveModal,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionBody,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectEvalResults } from '../../../../../../state/application/selectors/exercise.selectors';
import { form, FormField } from '@angular/forms/signals';
import { PatientStatus } from 'fuesim-digital-shared';
import { patientStatusAllowedValues, statusNames } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    EvalCriterion,
    EvalcriterionType,
    newXPatientsAtStatusEvalCriterion,
} from '../../../../../../../../../shared/dist/models/evaluation-criterion';
interface inputData {
    countInput: number;
    patientStatusInput: PatientStatus;
}
@Component({
    selector: 'app-didactic-overview',
    templateUrl: './didactic-overview-modal.component.html',
    styleUrls: ['./didactic-overview-modal.component.scss'],
    imports: [
        NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionButton,
        NgbAccordionCollapse,
        NgbAccordionBody,
        FormField,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
    ],
})
export class DidacticOverviewModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    public readonly results = signal(
        Object.values(this.store.selectSignal(selectEvalResults)())
    );
    public readonly patientStatusAllowedValues = patientStatusAllowedValues;
    public readonly statusNames = statusNames;
    updatesCount = 0;
    creatingcriterion = false;
    inputModel = signal<inputData>({
        countInput: 0,
        patientStatusInput: 'black',
    });
    criterionForm = form(this.inputModel);
    constructor() {
        effect(() => {
            if (this.updatesCount) {
                this.results.set(
                    Object.values(this.store.selectSignal(selectEvalResults)())
                );
            }
        });
    }
    private updateResults() {
        this.results.set(
            Object.values(this.store.selectSignal(selectEvalResults)())
        );
        this.updatesCount += 1;
    }
    private async createCriterion(criterion: EvalCriterion) {
        await this.exerciseService.proposeAction({
            type: '[EvalCriterion] New Criterion',
            criterion: criterion,
        });
        this.updateResults();
    }
    public submitCriterion(criterionType: EvalcriterionType) {
        switch (criterionType) {
            case 'xPatientsAtStatus': {
                const criterion = newXPatientsAtStatusEvalCriterion(
                    'Patienten mit Sichtungskategorie',
                    this.criterionForm.countInput().value(),
                    this.criterionForm.patientStatusInput().value()
                );
                this.createCriterion(criterion);
                break;
            }
            default:
                break;
        }
    }
    public close() {
        this.activeModal.close();
    }
}
