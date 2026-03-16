import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'fuesim-digital-shared';
import type {
    ChangedImageTemplateValues,
    EditableImageTemplateValues,
} from '../image-template-form/image-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { ImageTemplateFormComponent } from '../image-template-form/image-template-form.component';

@Component({
    selector: 'app-create-image-template-modal',
    templateUrl: './create-image-template-modal.component.html',
    styleUrls: ['./create-image-template-modal.component.scss'],
    imports: [ImageTemplateFormComponent],
})
export class CreateImageTemplateModalComponent {
    readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    public readonly editableImageTemplateValues: EditableImageTemplateValues = {
        url: null,
        height: 100,
        name: null,
    };

    public createImageTemplate({
        url,
        height,
        name,
        aspectRatio,
    }: ChangedImageTemplateValues) {
        this.exerciseService
            .proposeAction({
                type: '[MapImageTemplate] Add mapImageTemplate',
                mapImageTemplate: {
                    id: uuid(),
                    type: 'mapImageTemplate',
                    image: {
                        url,
                        height,
                        aspectRatio,
                    },
                    name,
                },
            })
            .then((response) => {
                if (response.success) {
                    this.close();
                }
            });
    }

    public close() {
        this.activeModal.close();
    }
}
