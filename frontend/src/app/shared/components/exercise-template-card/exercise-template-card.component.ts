import { Component, input, output, inject } from '@angular/core';
import type {
    GetExerciseTemplateResponseData,
    PatchExerciseTemplateRequestData,
} from 'fuesim-digital-shared';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { InlineTextEditorComponent } from '../inline-text-editor/inline-text-editor.component';
import { CreateParallelExerciseModalComponent } from '../../../pages/exercises/shared/create-parallel-exercise-modal/create-parallel-exercise-modal.component';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service.js';

@Component({
    selector: 'app-exercise-template-card',
    templateUrl: './exercise-template-card.component.html',
    styleUrls: ['./exercise-template-card.component.scss'],
    imports: [
        InlineTextEditorComponent,
        RouterLink,
        DatePipe,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
    ],
})
export class ExerciseTemplateCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly ngbModalService = inject(NgbModal);
    private readonly parallelExerciseService = inject(ParallelExerciseService);
    protected readonly parallelExercisesEnabled =
        this.parallelExerciseService.parallelExercisesEnabled.value;

    readonly exerciseTemplate = input<GetExerciseTemplateResponseData>();
    readonly updated = output();

    async patchExerciseTemplate(data: PatchExerciseTemplateRequestData) {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        await this.apiService.patchExerciseTemplate(exerciseTemplate.id, data);
        this.updated.emit();
    }

    async createExercise() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        const { trainerKey } = await this.apiService.createExerciseFromTemplate(
            exerciseTemplate.id
        );
        this.messageService.postMessage({
            title: 'Übung erfolgreich erstellt',
            body: '',
            color: 'success',
        });
        this.router.navigate(['/exercises', trainerKey]);
    }

    createParallelExercise() {
        const modalRef = this.ngbModalService.open(
            CreateParallelExerciseModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as CreateParallelExerciseModalComponent;
        componentInstance.exerciseTemplate.set(this.exerciseTemplate()!);
    }

    async deleteExerciseTemplate() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übungsvorlage löschen',
            description:
                'Möchten Sie die Übungsvorlage wirklich unwiederbringlich löschen?',
            confirmationString: exerciseTemplate.trainerKey,
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.deleteExerciseTemplate(exerciseTemplate.id);
        this.messageService.postMessage({
            title: 'Übungsvorlage erfolgreich gelöscht',
            color: 'success',
        });
        this.updated.emit();
    }
}
