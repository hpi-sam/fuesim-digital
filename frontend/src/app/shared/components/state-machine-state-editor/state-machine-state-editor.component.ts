import { Component, computed, input, model } from '@angular/core';
import type {
    TechnicalChallengeState,
    UserGeneratedContent,
    Transition,
    TechnicalChallengeStateId,
    TechnicalChallengeStateMachine,
} from 'fuesim-digital-shared';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';

@Component({
    selector: 'app-state-machine-state-editor',
    imports: [UserGeneratedContentEditorComponent],
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

    public readonly transitions = computed<
        (Transition & { toName: string | undefined })[]
    >(() => {
        const nameOf = (id: TechnicalChallengeStateId) =>
            this.stateMachine().states[id]?.title;
        return this.stateMachine()
            .transitions.filter((t) => t.from === this.state().id)
            .map((t) => ({ ...t, toName: nameOf(t.to) }));
    });

    public updateContent(newContent: UserGeneratedContent) {
        console.log(`new content ${newContent}`);
    }
}
