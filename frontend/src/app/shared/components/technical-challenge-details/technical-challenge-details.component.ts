import {
    computed,
    OnInit,
    Signal,
    Component,
    inject,
    input,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    Personnel,
    TechnicalChallenge,
    Task,
    TechnicalChallengeState,
    Guard,
    UserGeneratedContent,
    TechnicalChallengeId,
} from 'fuesim-digital-shared';
import { currentStateOf } from 'fuesim-digital-shared';
import {
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import type { AppState } from '../../../state/app.state';
import { ValuesPipe } from '../../pipes/values.pipe';
import {
    createSelectPersonnel,
    createSelectTask,
    createSelectTechnicalChallenge,
    selectCurrentTime,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { ExerciseService } from '../../../core/exercise.service.js';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';

@Component({
    selector: 'app-technical-challenge-details',
    templateUrl: './technical-challenge-details.component.html',
    styleUrls: ['./technical-challenge-details.component.scss'],
    imports: [
        ValuesPipe,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        NgbNavOutlet,
        UserGeneratedContentEditorComponent,
    ],
})
export class TechnicalChallengeDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly technicalChallengeId = input.required<TechnicalChallengeId>();

    public readonly challengeAge = computed(() => {
        const technicalChallengeStartTime =
            this.technicalChallenge().simulationStartTime;
        return (
            this.store.selectSignal(selectCurrentTime)() -
            technicalChallengeStartTime
        );
    });

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    // eslint-disable-next-line
    public technicalChallenge!: Signal<TechnicalChallenge>;
    public readonly assignedPersonnel = computed<[Personnel, Task][]>(() => {
        const assignments = this.technicalChallenge().assignedPersonnel;
        return Object.entries(assignments).map(([personnelId, taskId]) => [
            this.store.selectSignal(createSelectPersonnel(personnelId))(),
            this.store.selectSignal(createSelectTask(taskId))(),
        ]);
    });

    public readonly guards = computed<Guard[]>(() =>
        this.technicalChallenge().transitions.map(({ guard }) => guard)
    );
    public readonly progressGuards = computed(() =>
        this.guards().filter((guard) => guard.type === 'progressGuard')
    );
    public readonly progressGuardsByTaskId = computed(
        () =>
            new Map(this.progressGuards().map((guard) => [guard.taskId, guard]))
    );
    public readonly timerGuards = computed(() =>
        this.guards().filter((guard) => guard.type === 'timerGuard')
    );

    public readonly currentState: Signal<TechnicalChallengeState> = computed(
        () => currentStateOf(this.technicalChallenge())
    );

    ngOnInit(): void {
        this.technicalChallenge = this.store.selectSignal(
            createSelectTechnicalChallenge(this.technicalChallengeId())
        );
    }

    updateContent(content: UserGeneratedContent) {
        this.exerciseService.proposeAction({
            type: '[TechnicalChallenge] Update state content',
            technicalChallengeId: this.technicalChallengeId(),
            stateId: this.currentState().id,
            userGeneratedContent: content,
        });
    }
}
