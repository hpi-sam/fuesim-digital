import type { OnInit, Signal } from '@angular/core';
import { Component, inject, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getDefaultTechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';

// TODO: maybe discard everything

@Component({
    selector: 'app-edit-vehicle-template-modal',
    templateUrl: './edit-technical-challenge-template-modal.component.html',
    styleUrls: ['./edit-technical-challenge-template-modal.component.scss'],
    imports: [TechnicalChallengeTemplateFormComponent],
})
export class EditTechnicalChallengeTemplateModalComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);

    // This is set after the modal creation and therefore accessible in ngOnInit
    public technicalChallengeTemplateId!: UUID;
    public readonly technicalChallengeTemplate!: Signal<TechnicalChallengeTemplate>;

    ngOnInit(): void {
        // @ts-expect-error deferred initialization, depends on technicalChallengeId
        this.technicalChallengeTemplate = computed(() =>
            getDefaultTechnicalChallengeTemplate()
        );
        console.log(this.technicalChallengeTemplateId);
        console.log(this.technicalChallengeTemplate());
    }

    editTechnicalChallengeTemplate(
        newTechnicalChallengeTemplate: TechnicalChallengeTemplate
    ) {
        console.log(newTechnicalChallengeTemplate);
        // TODO: propose change
    }

    deleteTechnicalChallengeTemplate() {
        // TODO: discard?
        console.log('delete');
    }

    public close(): void {
        this.activeModal.close();
    }
}
