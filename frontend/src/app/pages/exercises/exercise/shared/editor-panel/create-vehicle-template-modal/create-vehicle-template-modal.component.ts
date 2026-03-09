import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'fuesim-digital-shared';
import type {
    ChangedVehicleTemplateValues,
    EditableVehicleTemplateValues,
} from '../vehicle-template-form/vehicle-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';

@Component({
    selector: 'app-create-vehicle-template-modal',
    templateUrl: './create-vehicle-template-modal.component.html',
    styleUrls: ['./create-vehicle-template-modal.component.scss'],
    standalone: false,
})
export class CreateVehicleTemplateModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    public readonly editableVehicleTemplateValues: EditableVehicleTemplateValues =
        {
            url: null,
            height: 100,
            name: null,
            patientCapacity: 1,
            type: null,
            materialTemplates: [],
            personnelTemplates: [],
        };

    public createVehicleTemplate({
        url,
        height,
        name,
        aspectRatio,
        patientCapacity,
        type,
        materialTemplateIds,
        personnelTemplateIds,
    }: ChangedVehicleTemplateValues) {
        this.exerciseService
            .proposeAction({
                type: '[VehicleTemplate] Add vehicleTemplate',
                vehicleTemplate: {
                    id: uuid(),
                    type: 'vehicleTemplate',
                    image: {
                        url,
                        height,
                        aspectRatio,
                    },
                    name,
                    materialTemplateIds,
                    personnelTemplateIds,
                    patientCapacity,
                    vehicleType: type,
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
