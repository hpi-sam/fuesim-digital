import { output, Component, inject, signal, effect } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    ExerciseTemplateId,
    GetExerciseTemplateResponseData,
    GetExerciseTemplateViewportsResponseData,
    PostParallelExerciseRequestData,
    postParallelExerciseRequestDataSchema,
} from 'fuesim-digital-shared';
import { Router } from '@angular/router';
import { disabled, form, validateStandardSchema } from '@angular/forms/signals';
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
    private readonly router = inject(Router);

    public exerciseTemplate = signal<GetExerciseTemplateResponseData | null>(
        null
    );
    public readonly created = output<boolean>();

    model = signal<PostParallelExerciseRequestData>({
        joinViewportId: '',
        name: '',
        templateId: '' as ExerciseTemplateId,
    });
    parallelExerciseForm = form(this.model, (schemaPath) => {
        disabled(
            schemaPath.joinViewportId,
            () => !this.viewportsLoading() && !this.viewports()?.length
        );
        validateStandardSchema(
            schemaPath,
            postParallelExerciseRequestDataSchema
        );
    });

    viewports = signal<GetExerciseTemplateViewportsResponseData | null>(null);
    viewportsLoading = signal<boolean>(true);

    constructor() {
        effect(async () => {
            const exerciseTemplate = this.exerciseTemplate();
            if (!exerciseTemplate) return;
            this.model.set({
                name: exerciseTemplate.name,
                templateId: exerciseTemplate.id,
                joinViewportId: '',
            });
            this.viewports.set(
                await this.apiService.getExerciseTemplateViewportsById(
                    exerciseTemplate.id
                )
            );
            this.viewportsLoading.set(false);
        });
    }

    public async create() {
        const res = await this.apiService.createParallelExercise(this.model());
        this.created.emit(true);
        this.activeModal.close();
        await this.router.navigate(['/exercises/parallel', res.id]);
    }

    public close() {
        this.activeModal.close();
    }
}
