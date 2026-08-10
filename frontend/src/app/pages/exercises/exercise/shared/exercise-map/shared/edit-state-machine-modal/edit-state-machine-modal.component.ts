import {
    Component,
    computed,
    inject,
    OnInit,
    type Signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type {
    UUID,
    StateMachine,
    TechnicalChallenge,
    StateMachineDefinition,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import {
    EditStateMachineFormComponent,
    type TaskNameMap,
} from '../../../editor-panel/edit-state-machine-form/edit-state-machine-form.component.js';
import type { AppState } from '../../../../../../../state/app.state.js';
import { ExerciseService } from '../../../../../../../core/exercise.service.js';
import { createSelectTechnicalChallenge } from '../../../../../../../state/application/selectors/exercise.selectors.js';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot.js';
import { HelpButtonComponent } from '../../../../../../../help-button/help-button.component.js';

export function openEditStateMachineModalComponent(
    ngbModalService: NgbModal,
    containingTechnicalChallengeId: UUID,
    stateMachineId: UUID,
    taskNameMap: Signal<TaskNameMap>
) {
    const modalRef = ngbModalService.open(EditStateMachineModalComponent, {
        size: 'xl',
    });
    const componentInstance =
        modalRef.componentInstance as EditStateMachineModalComponent;
    componentInstance.initialStateMachineId = stateMachineId;
    componentInstance.containingTechnicalChallengeId =
        containingTechnicalChallengeId;
    // @ts-expect-error assigning to readonly
    componentInstance.taskNameMap = taskNameMap;
}

@Component({
    selector: 'app-edit-state-machine-modal',
    imports: [EditStateMachineFormComponent, HelpButtonComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './edit-state-machine-modal.component.html',
})
class EditStateMachineModalComponent implements OnInit {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    // all set, when instantiating component
    containingTechnicalChallengeId!: UUID;
    initialStateMachineId: UUID | undefined;
    readonly taskNameMap!: Signal<TaskNameMap>;

    private readonly technicalChallenge!: Signal<TechnicalChallenge>;
    readonly stateMachine!: Signal<StateMachine>;
    readonly isPrimaryStateMachine!: Signal<boolean>;

    readonly modalTitle = computed(
        () => `Teilherausforderung: ${this.stateMachine().name}`
    );

    public close() {
        this.activeModal.close();
    }

    ngOnInit(): void {
        // @ts-expect-error initialization
        this.technicalChallenge = this.store.selectSignal(
            createSelectTechnicalChallenge(this.containingTechnicalChallengeId)
        );
        // @ts-expect-error initialization
        this.stateMachine = computed(() => {
            const template = this.technicalChallenge();
            console.assert(
                !!this.initialStateMachineId,
                'Creating new state machines is not implemented.'
            );
            const stateMachine =
                template.stateMachines[
                    this.initialStateMachineId as StateMachine['id']
                ];
            return stateMachine;
        });
        // @ts-expect-error initialization
        this.isPrimaryStateMachine = computed(
            () =>
                Object.values(this.technicalChallenge().stateMachines).at(0)
                    ?.id === this.initialStateMachineId
        );
    }

    public async updateStateMachine(
        updatedStateMachine: StateMachineDefinition
    ) {
        const currentChallenge = selectStateSnapshot(
            createSelectTechnicalChallenge(this.containingTechnicalChallengeId),
            this.store
        );

        const updatedMachines: TechnicalChallenge['stateMachines'] = {
            ...currentChallenge.stateMachines,
            [updatedStateMachine.id]: {
                ...currentChallenge.stateMachines[updatedStateMachine.id],
                ...updatedStateMachine,
            },
        };

        const updatedChallenge: TechnicalChallenge = {
            ...currentChallenge,
            stateMachines: updatedMachines,
        };

        this.exerciseService.proposeAction({
            type: '[TechnicalChallenge] Update technical challenge',
            updatedTechnicalChallenge: updatedChallenge,
        });
    }
}
