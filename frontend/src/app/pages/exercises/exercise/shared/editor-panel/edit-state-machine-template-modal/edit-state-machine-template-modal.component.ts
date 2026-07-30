import {
    Component,
    computed,
    inject,
    OnInit,
    type Signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type {
    UUID,
    StateMachine,
    TechnicalChallengeTemplate,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { EditStateMachineFormComponent } from '../edit-state-machine-form/edit-state-machine-form.component.js';
import type { AppState } from '../../../../../../state/app.state.js';
import { createSelectTechnicalChallengeTemplate } from '../../../../../../state/application/selectors/exercise.selectors.js';
import { ExerciseService } from '../../../../../../core/exercise.service.js';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot.js';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';

@Component({
    selector: 'app-edit-state-machine-template-modal',
    imports: [EditStateMachineFormComponent, HelpButtonComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './edit-state-machine-template-modal.component.html',
})
export class EditStateMachineTemplateModalComponent implements OnInit {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    // set, when instantiating component
    containingTechnicalChallengeTemplateId!: UUID;
    // set, when instantiating component
    initialStateMachineId: UUID | undefined;

    private readonly technicalChallengeTemplate!: Signal<TechnicalChallengeTemplate>;
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
        this.technicalChallengeTemplate = this.store.selectSignal(
            createSelectTechnicalChallengeTemplate(
                this.containingTechnicalChallengeTemplateId
            )
        );
        // @ts-expect-error initialization
        this.stateMachine = computed(() => {
            const template = this.technicalChallengeTemplate();
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
                Object.values(
                    this.technicalChallengeTemplate().stateMachines
                ).at(0)?.id === this.initialStateMachineId
        );
    }

    public async updateStateMachine(updatedStateMachine: StateMachine) {
        const currentTemplate: TechnicalChallengeTemplate = selectStateSnapshot(
            createSelectTechnicalChallengeTemplate(
                this.containingTechnicalChallengeTemplateId
            ),
            this.store
        );

        const updatedMachines: TechnicalChallengeTemplate['stateMachines'] = {
            ...currentTemplate.stateMachines,
            [updatedStateMachine.id]: updatedStateMachine,
        };

        const updatedTemplate: TechnicalChallengeTemplate = {
            ...currentTemplate,
            stateMachines: updatedMachines,
        };

        this.exerciseService.proposeAction({
            type: '[TechnicalChallengeTemplate] Update template',
            updatedTechnicalChallengeTemplate: updatedTemplate,
        });
    }
}
