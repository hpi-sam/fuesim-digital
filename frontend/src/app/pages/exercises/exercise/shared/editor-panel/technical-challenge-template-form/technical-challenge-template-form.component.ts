import {
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    model,
} from '@angular/core';
import {
    TechnicalChallengeTemplate,
    cloneDeepMutable,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import {
    applyEach,
    disabled,
    form,
    FormField,
    readonly,
} from '@angular/forms/signals';
import { castDraft, type WritableDraft } from 'immer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type {
    StateMachineDefinition,
    StateMachine,
} from 'fuesim-digital-shared';
import {
    CdkDrag,
    type CdkDragDrop,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import type { TaskNameMap } from '../edit-state-machine-form/edit-state-machine-form.component.js';
import { openEditStateMachineTemplateModal } from '../edit-state-machine-template-modal/edit-state-machine-template-modal.component.js';
@Component({
    selector: 'app-technical-challenge-template-form',
    imports: [FormsModule, FormField, CdkDropList, CdkDrag],
    templateUrl: './technical-challenge-template-form.component.html',
})
export class TechnicalChallengeTemplateFormComponent {
    readonly technicalChallengeTemplate =
        model.required<TechnicalChallengeTemplate>();
    readonly taskNameMap = input.required<TaskNameMap>();

    readonly formModel = linkedSignal({
        source: this.technicalChallengeTemplate,
        computation: domainToFormModel,
    });

    readonly templateForm = form(
        this.formModel,
        (schema) => {
            readonly(schema.id);
            disabled(schema.name);
            applyEach(schema.stateMachines, readonly);
        },
        {
            submission: {
                action: async (tree) =>
                    this.technicalChallengeTemplate.set(
                        this.formToDomainModel(tree().value())
                    ),
            },
        }
    );
    private readonly ngbModalService = inject(NgbModal);

    public async editStateMachine(stateMachine: StateMachineFormModel) {
        openEditStateMachineTemplateModal(
            this.ngbModalService,
            computed(
                () =>
                    this.technicalChallengeTemplate().stateMachines[
                        stateMachine.id as StateMachine['id']
                    ]!
            ),
            computed(
                () => this.formModel().primaryStateMachineId === stateMachine.id
            ),
            async (updatedStateMachine: StateMachineDefinition) => {
                this.technicalChallengeTemplate.update((currentTemplate) => {
                    const updatedTemplate = cloneDeepMutable(currentTemplate);
                    updatedTemplate.stateMachines[updatedStateMachine.id] =
                        castDraft(updatedStateMachine);
                    return updatedTemplate;
                });
            },
            computed(() => this.taskNameMap())
        );
    }

    stateMachineDropped(event: CdkDragDrop<StateMachineFormModel[]>) {
        this.templateForm.stateMachines().value.update((oldStateMachines) => {
            moveItemInArray(
                oldStateMachines,
                event.previousIndex,
                event.currentIndex
            );
            return oldStateMachines;
        });
    }

    private formToDomainModel(
        formValue: TechnicalChallengeFormModel
    ): TechnicalChallengeTemplate {
        const previousTemplate = this.technicalChallengeTemplate();

        const stateMachines = Object.fromEntries(
            formValue.stateMachines.map(({ id, name }) => [
                id,
                previousTemplate.stateMachines[id as StateMachine['id']]!,
            ])
        );

        return {
            ...previousTemplate,
            name: formValue.name,
            stateMachines,
        };
    }
}

interface TechnicalChallengeFormModel {
    id: string;
    name: string;
    stateMachines: StateMachineFormModel[];
    primaryStateMachineId: string;
}
interface StateMachineFormModel {
    id: string;
    name: string;
}

function stateMachineToFormModel(
    stateMachine: WritableDraft<StateMachineDefinition>
): StateMachineFormModel {
    return {
        id: stateMachine.id,
        name: stateMachine.name,
    };
}
function domainToFormModel(
    template: TechnicalChallengeTemplate
): TechnicalChallengeFormModel {
    const mutableCopy = cloneDeepMutable(template);
    return {
        id: mutableCopy.id,
        name: mutableCopy.name,
        stateMachines: Object.values(mutableCopy.stateMachines).map(
            stateMachineToFormModel
        ),
        primaryStateMachineId: mutableCopy.primaryStateMachineId,
    };
}
