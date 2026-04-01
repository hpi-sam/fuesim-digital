import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'fuesim-digital-shared';
import {
    ChangedMeasureTemplateValues,
    EditableMeasureTemplateValues,
    MeasureTemplateFormComponent,
} from '../measure-template-form/measure-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';

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
            name: null,
            properties: [],
        };

    public createMeasureTemplate({
        name,
        properties,
    }: ChangedMeasureTemplateValues) {
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
