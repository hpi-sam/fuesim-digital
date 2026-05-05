import { Component, computed, input, model } from '@angular/core';
import {
    type TechnicalChallengeState,
    type UserGeneratedContent,
    type Transition,
    type TechnicalChallengeStateId,
    type TechnicalChallengeStateMachine,
    type UUID,
    type Guard,
    newProgressGuardForTask,
    type ProgressGuard,
} from 'fuesim-digital-shared';
import { produce } from 'immer';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';
import {
    SearchableDropdownComponent,
    type SearchableDropdownOption,
} from '../searchable-dropdown/searchable-dropdown.component.js';

@Component({
    selector: 'app-state-machine-state-editor',
    imports: [
        UserGeneratedContentEditorComponent,
        SearchableDropdownComponent,
        NgbPopover,
    ],
    templateUrl: './state-machine-state-editor.component.html',
    styleUrl: './state-machine-state-editor.component.scss',
})
export class StateMachineStateEditorComponent {
    public readonly stateMachine =
        model.required<TechnicalChallengeStateMachine>();
    public readonly stateId = input.required<TechnicalChallengeStateId>();
    public readonly state = computed<TechnicalChallengeState>(
        () => this.stateMachine().states[this.stateId()]!
    );

    public readonly transitions = computed<(Transition & { toName: string })[]>(
        () => {
            const nameOf = (id: TechnicalChallengeStateId) =>
                this.stateMachine().states[id]?.title;
            return Object.values(this.stateMachine().transitions)
                .filter((t) => t.from === this.state().id)
                .map((t) => ({ ...t, toName: nameOf(t.to) ?? '[Unbekannt]' }));
        }
    );
    public readonly transitionOptions = computed<
        SearchableDropdownOption<TechnicalChallengeStateId>[]
    >(() =>
        Object.values(this.stateMachine().states)
            .filter((s) => s.id !== this.state().id)
            .map((s) => ({
                name: s.title,
                key: s.id,
            }))
    );
    public readonly possibleGuards = computed<Guard[]>(() =>
        Object.values(this.stateMachine().relevantTasks).map<ProgressGuard>(
            (task) => newProgressGuardForTask(task, 0, 0)
        )
    );
    public readonly guardOptions = computed<SearchableDropdownOption[]>(() => {
        const progressGuards: SearchableDropdownOption[] = Object.values(
            this.stateMachine().relevantTasks
        ).map((task) => ({
            key: task.id,
            name: task.taskName,
            color: 'green',
        }));
        const timerGuards: SearchableDropdownOption[] = [];

        return [...progressGuards, ...timerGuards];
    });

    public updateContent(newContent: UserGeneratedContent) {
        console.log(`new content ${newContent}`);
    }

    protected updateStateTransition(
        transitionId: UUID,
        newTargetState: SearchableDropdownOption<TechnicalChallengeStateId>
    ) {
        this.stateMachine.update(
            produce((draft) => {
                const t = draft.transitions[transitionId];
                if (t) t.to = newTargetState.key;
            })
        );
    }

    protected deleteStateTransition(id: UUID) {
        this.stateMachine.update(
            produce((draft) => {
                delete draft.transitions[id];
            })
        );
    }

    protected addTransition(target: SearchableDropdownOption) {
        const fromId = this.state().id;
        // this.stateMachine.update(produce(draft => {
        //     const id = uuid();
        //     const guard = this.possibleGuards().
        //     draft.transitions[id] = {id, to: "", from: fromId, guard}
        // }))
    }
}
