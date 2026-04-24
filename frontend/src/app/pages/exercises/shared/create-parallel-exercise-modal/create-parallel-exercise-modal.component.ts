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
import {
    disabled,
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { DisplayModelValidationComponent } from '../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-create-parallel-exercise-modal',
    templateUrl: './create-parallel-exercise-modal.component.html',
    styleUrls: ['./create-parallel-exercise-modal.component.scss'],
    imports: [DisplayModelValidationComponent, FormsModule, FormField],
})
export class CreateParallelExerciseModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly router = inject(Router);

    public readonly exerciseTemplate =
        signal<GetExerciseTemplateResponseData | null>(null);
    public readonly created = output<boolean>();

    readonly model = signal<PostParallelExerciseRequestData>({
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

    readonly viewports =
        signal<GetExerciseTemplateViewportsResponseData | null>(null);
    readonly viewportsLoading = signal<boolean>(true);

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
