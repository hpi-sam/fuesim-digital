import {
    computed,
    Component,
    inject,
    input,
    type OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { TechnicalChallenge, StateMachine } from 'fuesim-digital-shared';
import {
    NgbModal,
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
    selectTaskTypes,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';
import { StateMachineDetailsComponent } from '../state-machine-details/state-machine-details.component.js';
import { ExerciseService } from '../../../core/exercise.service.js';
import { openEditStateMachineModalComponent } from '../../../pages/exercises/exercise/shared/exercise-map/shared/edit-state-machine-modal/edit-state-machine-modal.component.js';
import type { TaskNameMap } from '../../../pages/exercises/exercise/shared/editor-panel/edit-state-machine-form/edit-state-machine-form.component.js';

@Component({
    selector: 'app-technical-challenge-details',
    templateUrl: './technical-challenge-details.component.html',
    styleUrls: ['./technical-challenge-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
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
export class TechnicalChallengeDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly ngbModalService = inject(NgbModal);

    readonly technicalChallenge = input.required<TechnicalChallenge>();
    readonly stateMachines = computed(() =>
        Object.values(this.technicalChallenge().stateMachines)
    );

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);
    readonly exerciseStatus = this.store.selectSignal(selectExerciseStatus);

    public readonly currentTime = this.store.selectSignal(selectCurrentTime);
    readonly isTrainer = computed(() => this.currentRole() === 'trainer');
    readonly taskNameMap = computed<TaskNameMap>(() => {
        const taskTypes = this.store.selectSignal(selectTaskTypes)();
        return new Map(Object.entries(taskTypes));
    });

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

    editStateMachine(stateMachine: StateMachine) {
        openEditStateMachineModalComponent(
            this.ngbModalService,
            this.technicalChallenge().id,
            stateMachine.id,
            this.taskNameMap
        );
    }

    ngOnInit(): void {
        this.scoutStateMachine(this.stateMachines()[0]!);
    }
    protected readonly currentStateOf = currentStateOf;
}
