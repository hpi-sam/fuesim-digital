import { Component, computed, inject, model } from '@angular/core';
import {
    TechnicalChallengeStateMachine,
    type ProgressGuard,
    relevantTaskIdsOf,
    Task,
} from 'fuesim-digital-shared';
import {
    NgbAccordionBody,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionDirective,
    NgbAccordionHeader,
    NgbAccordionItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { newProgressGuardForTask } from 'fuesim-digital-shared';
import type { AppState } from '../../../state/app.state.js';
import { StateMachineStateEditorComponent } from '../state-machine-state-editor/state-machine-state-editor.component.js';
import { createSelectTask } from '../../../state/application/selectors/exercise.selectors.js';

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
    private readonly store = inject<Store<AppState>>(Store);
    public readonly stateMachine =
        model.required<TechnicalChallengeStateMachine>();

    readonly states = computed(() => Object.values(this.stateMachine().states));
    readonly availableProgressGuards = computed<ProgressGuard[]>(() => {
        const taskIds = relevantTaskIdsOf(this.stateMachine());
        const tasks: Task[] = taskIds.map((id) =>
            this.store.selectSignal(createSelectTask(id))()
        );
        const guards: ProgressGuard[] = tasks.map((task) =>
            newProgressGuardForTask(task)
        );
        return guards;
    });
}
