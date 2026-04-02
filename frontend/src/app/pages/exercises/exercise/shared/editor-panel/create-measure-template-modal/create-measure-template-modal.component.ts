import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'fuesim-digital-shared';
import { MeasureTemplateFormComponent } from '../measure-template-form/measure-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    EditableMeasureTemplateValues,
    MeasureTemplateValues,
} from '../measure-template-form/measure-template-form-utils';

@Component({
    selector: 'app-create-measure-template-modal',
    imports: [MeasureTemplateFormComponent],
    templateUrl: './create-measure-template-modal.component.html',
    styleUrl: './create-measure-template-modal.component.scss',
})
export class CreateMeasureTemplateModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    public readonly editableMeasureTemplateValues: EditableMeasureTemplateValues =
        {
            name: '',
            properties: [],
        };

    public createMeasureTemplate({ name, properties }: MeasureTemplateValues) {
        this.exerciseService
            .proposeAction({
                type: '[MeasureTemplate] Add measureTemplate',
                measureTemplate: {
                    id: uuid(),
                    name,
                    properties,
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
