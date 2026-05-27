import { computed, Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TechnicalChallenge, StateMachine } from 'fuesim-digital-shared';
import {
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { currentStateOf } from 'fuesim-digital-shared';
import type { AppState } from '../../../state/app.state';
import {
    selectCurrentTime,
    selectExerciseStatus,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';
import { StateMachineDetailsComponent } from '../state-machine-details/state-machine-details.component.js';
import { ExerciseService } from '../../../core/exercise.service.js';

@Component({
    selector: 'app-technical-challenge-details',
    templateUrl: './technical-challenge-details.component.html',
    styleUrls: ['./technical-challenge-details.component.scss'],
    imports: [
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        NgbNavOutlet,
        StateMachineDetailsComponent,
        UserGeneratedContentEditorComponent,
    ],
})
export class TechnicalChallengeDetailsComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly technicalChallenge = input.required<TechnicalChallenge>();
    readonly stateMachines = computed(() =>
        Object.values(this.technicalChallenge().stateMachines)
    );

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);
    readonly exerciseStatus = this.store.selectSignal(selectExerciseStatus);

    public readonly currentTime = this.store.selectSignal(selectCurrentTime);

    scoutStateMachine(stateMachine: StateMachine) {
        if (this.currentRole() === 'participant') {
            const state = currentStateOf(stateMachine);
            this.exerciseService.proposeAction({
                type: '[TechnicalChallenge] Mark state as viewed',
                technicalChallengeId: this.technicalChallenge().id,
                stateMachineId: stateMachine.id,
                stateId: state.id,
            });
        }
    }
    protected readonly currentStateOf = currentStateOf;
}
