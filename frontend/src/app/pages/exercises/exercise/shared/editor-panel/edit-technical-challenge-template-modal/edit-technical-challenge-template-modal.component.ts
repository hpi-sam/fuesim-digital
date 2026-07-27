import {
    Component,
    inject,
    type OnInit,
    signal,
    type WritableSignal,
} from '@angular/core';
import { UUID } from 'fuesim-digital-shared';
import type { TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service.js';
import { AppState } from '../../../../../../state/app.state.js';
import { ExerciseService } from '../../../../../../core/exercise.service.js';
import { createSelectTechnicalChallengeTemplate } from '../../../../../../state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-edit-technical-challenge-template-modal',
    imports: [],
    templateUrl: './edit-technical-challenge-template-modal.component.html',
    styleUrl: './edit-technical-challenge-template-modal.component.scss',
})
export class EditTechnicalChallengeTemplateModalComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    // This is set after the modal creation and therefore accessible in ngOnInit
    public technicalChallengeTemplateId!: UUID;

    public readonly technicalChallengeTemplate!: WritableSignal<TechnicalChallengeTemplate>;

    ngOnInit(): void {
        // @ts-expect-error initialization
        this.technicalChallengeTemplate = signal(
            this.store.selectSignal(
                createSelectTechnicalChallengeTemplate(
                    this.technicalChallengeTemplateId
                )
            )
        );
    }
}
