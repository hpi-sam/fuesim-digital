import {
    Component,
    computed,
    inject,
    type Signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type {
    StateMachine,
    StateMachineDefinition,
} from 'fuesim-digital-shared';
import {
    EditStateMachineFormComponent,
    type TaskNameMap,
} from '../edit-state-machine-form/edit-state-machine-form.component.js';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';

export function openEditStateMachineTemplateModal(
    ngbModal: NgbModal,
    stateMachine: Signal<StateMachineDefinition>,
    isPrimaryStateMachine: Signal<boolean>,
    updateStateMachineCallback: (
        updatedStateMachine: StateMachineDefinition
    ) => Promise<void>,
    taskNameMap: Signal<TaskNameMap>
) {
    const modalRef = ngbModal.open(EditStateMachineTemplateModalComponent, {
        size: 'xl',
    });
    const componentInstance =
        modalRef.componentInstance as EditStateMachineTemplateModalComponent;

    // @ts-expect-error initializing readonly signal
    componentInstance.stateMachine = stateMachine;
    // @ts-expect-error initializing readonly signal
    componentInstance.isPrimaryStateMachine = isPrimaryStateMachine;
    componentInstance.updateStateMachineCallback = updateStateMachineCallback;
    // @ts-expect-error initializing readonly signal
    componentInstance.taskNameMap = taskNameMap;
}

@Component({
    selector: 'app-edit-state-machine-template-modal',
    imports: [EditStateMachineFormComponent, HelpButtonComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './edit-state-machine-template-modal.component.html',
})
class EditStateMachineTemplateModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    // set in open-function
    readonly stateMachine!: Signal<StateMachine>;
    readonly isPrimaryStateMachine!: Signal<boolean>;
    updateStateMachineCallback!: (
        updatedStateMachine: StateMachineDefinition
    ) => Promise<void>;
    readonly taskNameMap!: Signal<TaskNameMap>;

    readonly modalTitle = computed(
        () => `Teilherausforderung: ${this.stateMachine().name}`
    );

    public close() {
        this.activeModal.close();
    }

    public async updateStateMachine(
        updatedStateMachine: StateMachineDefinition
    ) {
        return this.updateStateMachineCallback(updatedStateMachine);
    }
}
