import {
    Component,
    inject,
    type OnInit,
    type WritableSignal,
    ChangeDetectionStrategy,
    computed,
} from '@angular/core';
import { TypeAssertedObject, UUID } from 'fuesim-digital-shared';
import type { TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state.js';
import {
    createSelectTechnicalChallengeTemplate,
    selectTaskTypes,
} from '../../../../../../state/application/selectors/exercise.selectors.js';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';
import { ExerciseService } from '../../../../../../core/exercise.service.js';
import type { TaskNameMap } from '../edit-state-machine-form/edit-state-machine-form.component.js';

export function openEditTechnicalChallengeTemplateModal(
    ngbModalService: NgbModal,
    technicalChallengeTemplate: UUID
) {
    const modalRef = ngbModalService.open(
        EditTechnicalChallengeTemplateModalComponent,
        {
            size: 'lg',
        }
    );
    const componentInstance =
        modalRef.componentInstance as EditTechnicalChallengeTemplateModalComponent;
    componentInstance.technicalChallengeTemplateId = technicalChallengeTemplate;
}

@Component({
    selector: 'app-edit-technical-challenge-template-modal',
    imports: [TechnicalChallengeTemplateFormComponent, HelpButtonComponent],
    templateUrl: './edit-technical-challenge-template-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
})
class EditTechnicalChallengeTemplateModalComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    // This is set after the modal creation and therefore accessible in ngOnInit
    technicalChallengeTemplateId!: UUID;
    readonly taskNameMap = computed<TaskNameMap>(() => {
        const tasks = this.store.selectSignal(selectTaskTypes)();

        return new Map(TypeAssertedObject.entries(tasks));
    });

    readonly technicalChallengeTemplate!: WritableSignal<TechnicalChallengeTemplate>;

    ngOnInit(): void {
        // @ts-expect-error initialization
        this.technicalChallengeTemplate = this.store.selectSignal(
            createSelectTechnicalChallengeTemplate(
                this.technicalChallengeTemplateId
            )
        );
    }

    public close(): void {
        this.activeModal.close();
    }

    protected async updateTechnicalChallengeTemplate(
        updatedTechnicalChallengeTemplate: TechnicalChallengeTemplate
    ) {
        await this.exerciseService.proposeAction({
            type: '[TechnicalChallengeTemplate] Update template',
            updatedTechnicalChallengeTemplate,
        });
    }
}
