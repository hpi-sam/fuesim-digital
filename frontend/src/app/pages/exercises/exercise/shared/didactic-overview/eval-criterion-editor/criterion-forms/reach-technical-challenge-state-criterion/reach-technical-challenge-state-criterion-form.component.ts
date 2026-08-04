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
    StateMachineId,
    StateMachineState,
    StateMachineStateId,
    TechnicalChallengeId,
} from 'fuesim-digital-shared';
import { AppState } from '../../../../../../../../state/app.state';
import { selectTechnicalChallenges } from '../../../../../../../../state/application/selectors/exercise.selectors';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

interface LocalInputData {
    technicalChallengeId: TechnicalChallengeId | '';
    targetStateMachineIds: StateMachineId[];
    targetStateMachineStateIds: {
        [targetStateMachineId: StateMachineId]: StateMachineStateId;
    };
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
    public readonly targetStateMachineIdsOut = output<StateMachineId[]>();
    public readonly targetStateMachineStateIdsOut = output<{
        [targetStateMachineId: StateMachineId]: StateMachineStateId;
    }>();

    readonly inputModel = signal<LocalInputData>({
        technicalChallengeId: '',
        targetStateMachineIds: [],
        targetStateMachineStateIds: {},
    });
    criterionForm = form(this.inputModel);

    public readonly evalCriterionCategoryNames = evalCriterionCategoryNames;
    public readonly evalCriterionTypesNames = evalCriterionTypesNames;

    constructor() {
        effect(() => {
            this.technicalChallengeIdOut.emit(
                this.criterionForm.technicalChallengeId().value()
            );
            this.targetStateMachineIdsOut.emit(
                this.criterionForm.targetStateMachineIds().value()
            );
            this.targetStateMachineStateIdsOut.emit(
                this.criterionForm.targetStateMachineStateIds().value()
            );
        });
    }

    private readonly tcs = this.store.selectSignal(selectTechnicalChallenges);
    public readonly technicalChallenges = signal(Object.values(this.tcs()));

    public readonly stateMachinesOfselectedTechnicalChallenge = computed(() => {
        if (this.criterionForm.technicalChallengeId().value() !== '') {
            const id = this.criterionForm.technicalChallengeId().value();
            const tcWithId =
                this.technicalChallenges().filter((tc) => tc.id === id)[0] ??
                null;
            return Object.values(tcWithId!.stateMachines);
        }
        return null;
    });
    public readonly stateMachineStates = computed(() =>
        this.stateMachinesOfselectedTechnicalChallenge()?.reduce<{
            [stateMachieId: StateMachineId]: StateMachineState[];
        }>((obj, machine) => {
            obj[machine.id] = Object.values(machine.states);
            return obj;
        }, {})
    );
    /**
     * adds the target stateMachineId and the stateMachineStateId to the target ids in the form;
     * @param machineId The id of the target state machine
     * @param stateId the id of the target state machine state
     */
    public selectTargetState(
        machineId: StateMachineId,
        stateId: StateMachineStateId
    ) {
        this.criterionForm.targetStateMachineIds().value.update((obj) => {
            if (!obj.includes(machineId)) {
                obj = [...obj, machineId];
            }
            return obj;
        });
        this.criterionForm.targetStateMachineStateIds().value.update((obj) => {
            obj[machineId] = stateId;
            return obj;
        });
    }
}
