import { Component, effect, input, linkedSignal, output } from '@angular/core';
import { computed, inject, type Signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import type {
    StateMachine,
    StateMachineState,
    ImageProperties,
    UserGeneratedContent,
    Task,
    Timer,
    UUID,
} from 'fuesim-digital-shared';
import { uuid, cloneDeepMutable } from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import {
    NgbAccordionBody,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionDirective,
    NgbAccordionHeader,
    NgbAccordionItem,
} from '@ng-bootstrap/ng-bootstrap';
import { NgOptimizedImage } from '@angular/common';
import { UserGeneratedContentEditorComponent } from '../../../../../../shared/components/user-generated-content-editor/user-generated-content-editor.component.js';
import type { AppState } from '../../../../../../state/app.state.js';
import { createSelectTaskType } from '../../../../../../state/application/selectors/exercise.selectors.js';
import {
    TimeInputComponent,
    TimeUnit,
} from '../../../../../../shared/components/time-input/time-input.component.js';

@Component({
    selector: 'app-edit-state-machine-form',
    imports: [
        FormsModule,
        FormField,
        UserGeneratedContentEditorComponent,
        TimeInputComponent,
        NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionButton,
        NgbAccordionCollapse,
        NgbAccordionBody,
        NgOptimizedImage,
    ],
    templateUrl: './edit-state-machine-form.component.html',
})
export class EditStateMachineFormComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly initialStateMachine = input.required<StateMachine>();
    readonly stateMachineModel = linkedSignal({
        source: this.initialStateMachine,
        computation: domainToFormModel,
    });
    readonly isPrimaryStateMachine = input<boolean>(false);

    readonly showStateImage = this.isPrimaryStateMachine;

    stateMachineForm = form(this.stateMachineModel);

    readonly updatedStateMachine = output<StateMachine>();

    constructor() {
        effect(() => {
            if (this.stateMachineForm().dirty()) {
                this.stateMachineForm().reset();

                const formState = this.stateMachineForm().value();
                this.updatedStateMachine.emit(
                    formModelToDomain(formState, this.initialStateMachine())
                );
            }
        });
    }

    nameOfTask(taskTypeId: UUID): Signal<string> {
        return computed(
            () =>
                this.store.selectSignal(createSelectTaskType(taskTypeId))()
                    .taskName
        );
    }

    protected readonly timeUnit = TimeUnit.s;
}

interface StateFormModel {
    id: string;
    title: string;
    image: ImageProperties;
    userGeneratedContent: UserGeneratedContent;
}
function stateToFormModel(state: StateMachineState): StateFormModel {
    return {
        id: state.id,
        title: state.title,
        image: state.image,
        userGeneratedContent: state.userGeneratedContent,
    };
}
function stateFromFormModel(
    stateForm: StateFormModel,
    stateMachine: StateMachine
): StateMachineState {
    const previous =
        stateMachine.states[stateForm.id as StateMachineState['id']];
    if (!previous) {
        // TODO
        console.error('Not implemented');
    }
    return {
        ...previous!,
        title: stateForm.title,
        image: stateForm.image,
        userGeneratedContent: stateForm.userGeneratedContent,
    };
}
interface StateMachineFormModel {
    id: string;
    name: string;
    states: StateFormModel[];
    tasks: Task[];
    timers: Timer[];
}
function domainToFormModel(
    stateMachine: StateMachine | undefined
): StateMachineFormModel {
    if (!stateMachine) {
        console.log('state machine was undefined');
        return {
            id: uuid(),
            name: '',
            states: [],
            tasks: [],
            timers: [],
        };
    }
    return {
        id: stateMachine.id,
        name: stateMachine.name,
        states: Object.values(stateMachine.states).map(stateToFormModel),
        tasks: Object.values(stateMachine.tasks).map(cloneDeepMutable),
        timers: Object.values(stateMachine.timers).map(cloneDeepMutable),
    };
}

function formModelToDomain(
    formModel: StateMachineFormModel,
    initialValue: StateMachine
): StateMachine {
    return {
        ...initialValue,
        name: formModel.name,
        states: Object.fromEntries(
            formModel.states.map((fM) => [
                fM.id,
                stateFromFormModel(fM, initialValue),
            ])
        ),
        tasks: Object.fromEntries(
            formModel.tasks.map((task) => [task.taskTypeId, task])
        ),
        timers: Object.fromEntries(
            formModel.timers
                .map((timer) => [timer.id, timer])
                .map(cloneDeepMutable)
        ),
    };
}
