import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type {
    ChangedImageTemplateValues,
    EditableImageTemplateValues,
} from '../image-template-form/image-template-form.component';

@Component({
    selector: 'app-create-image-template-modal',
    templateUrl: './create-image-template-modal.component.html',
    styleUrls: ['./create-image-template-modal.component.scss'],
    standalone: false,
})
export class CreateImageTemplateModalComponent {
    public readonly editableImageTemplateValues: EditableImageTemplateValues = {
        url: null,
        height: 100,
        name: null,
    };

    constructor(
        public readonly activeModal: NgbActiveModal,
        private readonly exerciseService: ExerciseService
    ) {}

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
