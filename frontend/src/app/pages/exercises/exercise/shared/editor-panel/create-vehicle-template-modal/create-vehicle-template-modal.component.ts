import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type {
    ChangedVehicleTemplateValues,
    EditableVehicleTemplateValues,
} from '../vehicle-template-form/vehicle-template-form.component';

@Component({
    selector: 'app-create-vehicle-template-modal',
    templateUrl: './create-vehicle-template-modal.component.html',
    styleUrls: ['./create-vehicle-template-modal.component.scss'],
    standalone: false,
})
export class CreateVehicleTemplateModalComponent {
    public readonly editableVehicleTemplateValues: EditableVehicleTemplateValues =
        {
            url: null,
            height: 100,
            name: null,
            patientCapacity: 1,
            type: null,
            materialTypes: [],
            personnelTypes: [],
        };

    constructor(
        private readonly activeModal: NgbActiveModal,
        private readonly exerciseService: ExerciseService
    ) {}

    public createVehicleTemplate({
        url,
        height,
        name,
        aspectRatio,
        patientCapacity,
        type,
        materialTypes,
        personnelTypes,
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
                    materials: materialTypes,
                    patientCapacity,
                    personnel: personnelTypes,
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
