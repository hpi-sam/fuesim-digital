import { Component, inject, input, linkedSignal } from '@angular/core';
import {
    TechnicalChallengeTemplate,
    cloneDeepMutable,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import type { StateMachine } from 'fuesim-digital-shared';
import type { WritableDraft } from 'immer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditStateMachineModalComponent } from '../edit-state-machine-modal/edit-state-machine-modal.component.js';

@Component({
    selector: 'app-technical-challenge-template-form',
    imports: [FormsModule, FormField],
    templateUrl: './technical-challenge-template-form.component.html',
})
export class TechnicalChallengeTemplateFormComponent {
    readonly technicalChallengeTemplate =
        input.required<TechnicalChallengeTemplate>();

    readonly formModel = linkedSignal({
        source: this.technicalChallengeTemplate,
        computation: domainToFormModel,
    });

    readonly templateForm = form(this.formModel, (schema) => {
        disabled(schema.name);
    });
    private readonly ngbModalService = inject(NgbModal);

    public async editStateMachine(stateMachine: StateMachineFormModel) {
        const modalRef = this.ngbModalService.open(
            EditStateMachineModalComponent,
            {
                size: 'lg',
            }
        );
        const componentInstance =
            modalRef.componentInstance as EditStateMachineModalComponent;
        componentInstance.initialStateMachineId = stateMachine.id;
        componentInstance.containingTechnicalChallengeTemplateId =
            this.technicalChallengeTemplate().id;
    }
}

interface TechnicalChallengeFormModel {
    id: string;
    name: string;
    stateMachines: StateMachineFormModel[];
}
interface StateMachineFormModel {
    id: string;
    name: string;
}

function stateMachineToFormModel(
    stateMachine: WritableDraft<StateMachine>
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
    };
}
