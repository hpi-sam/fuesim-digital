import {
    Component,
    inject,
    type OnInit,
    type WritableSignal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { UUID } from 'fuesim-digital-shared';
import type { TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state.js';
import { createSelectTechnicalChallengeTemplate } from '../../../../../../state/application/selectors/exercise.selectors.js';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';

@Component({
    selector: 'app-edit-technical-challenge-template-modal',
    imports: [TechnicalChallengeTemplateFormComponent, HelpButtonComponent],
    templateUrl: './edit-technical-challenge-template-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class EditTechnicalChallengeTemplateModalComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);

    // This is set after the modal creation and therefore accessible in ngOnInit
    public technicalChallengeTemplateId!: UUID;

    public readonly technicalChallengeTemplate!: WritableSignal<TechnicalChallengeTemplate>;

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
}
