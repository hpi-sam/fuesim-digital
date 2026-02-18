import { output, Component, inject, signal, effect } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgForm } from '@angular/forms';
import {
    GetExerciseTemplateResponseData,
    GetExerciseTemplateViewportsResponseData,
} from 'fuesim-digital-shared';
import { ApiService } from '../../../../core/api.service';

@Component({
    selector: 'app-create-parallel-exercise-modal',
    templateUrl: './create-parallel-exercise-modal.component.html',
    styleUrls: ['./create-parallel-exercise-modal.component.scss'],
    standalone: false,
})
export class CreateParallelExerciseModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);

    public exerciseTemplate = signal<GetExerciseTemplateResponseData | null>(
        null
    );
    public readonly created = output<boolean>();

    model = { joinViewportId: '' };

    viewports: GetExerciseTemplateViewportsResponseData | undefined;

    constructor() {
        effect(async () => {
            const exerciseTemplate = this.exerciseTemplate();
            if (!exerciseTemplate) return;
            this.viewports =
                await this.apiService.getExerciseTemplateViewportsById(
                    exerciseTemplate.id
                );
        });
    }

    public async create(form: NgForm) {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        await this.apiService.createParallelExercise({
            ...this.model,
            templateId: exerciseTemplate.id,
        });
        this.created.emit(true);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
