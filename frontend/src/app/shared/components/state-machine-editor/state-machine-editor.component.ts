import { Component, computed, model } from '@angular/core';
import type { TechnicalChallengeStateMachine } from 'fuesim-digital-shared';
import {
    NgbAccordionBody,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionDirective,
    NgbAccordionHeader,
    NgbAccordionItem,
} from '@ng-bootstrap/ng-bootstrap';
import { StateMachineStateEditorComponent } from '../state-machine-state-editor/state-machine-state-editor.component.js';

@Component({
    selector: 'app-state-machine-editor',
    imports: [
        StateMachineStateEditorComponent,
        NgbAccordionDirective,
        NgbAccordionBody,
        NgbAccordionButton,
        NgbAccordionCollapse,
        NgbAccordionHeader,
        NgbAccordionItem,
    ],
    templateUrl: './state-machine-editor.component.html',
    styleUrl: './state-machine-editor.component.scss',
})
export class StateMachineEditorComponent {
    public readonly stateMachine =
        model.required<TechnicalChallengeStateMachine>();

    readonly states = computed(() => Object.values(this.stateMachine().states));
    readonly tasks = computed(() =>
        Object.values(this.stateMachine().relevantTasks)
    );
}
