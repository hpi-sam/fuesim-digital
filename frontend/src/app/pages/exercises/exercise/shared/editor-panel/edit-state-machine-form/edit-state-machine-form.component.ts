import { Component, effect, input, linkedSignal, output } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import type {
    StateMachine,
    StateMachineState,
    ImageProperties,
    UserGeneratedContent,
} from 'fuesim-digital-shared';
import { uuid } from 'fuesim-digital-shared';
import { UserGeneratedContentEditorComponent } from '../../../../../../shared/components/user-generated-content-editor/user-generated-content-editor.component.js';

@Component({
    selector: 'app-edit-state-machine-form',
    imports: [FormsModule, FormField, UserGeneratedContentEditorComponent],
    templateUrl: './edit-state-machine-form.component.html',
})
export class EditStateMachineFormComponent {
    readonly initialStateMachine = input.required<StateMachine>();
    readonly stateMachineModel = linkedSignal({
        source: this.initialStateMachine,
        computation: domainToFormModel,
    });

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
        };
    }
    return {
        id: stateMachine.id,
        name: stateMachine.name,
        states: Object.values(stateMachine.states).map(stateToFormModel),
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
    };
}
