import { effect, signal, Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import { z } from 'zod';
import { FormsModule } from '@angular/forms';
import {
    coordinateStringSchema,
    OlMapCoordinatesInput,
    olMapCoordinatesSchema,
} from '../../exercise-map/utility/ol-map-manager';
import { OlMapManagerService } from '../../exercise-map/utility/ol-map-manager.service';
import { DisplayModelValidationComponent } from '../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-coordinate-picker-modal',
    templateUrl: './coordinate-picker-modal.component.html',
    styleUrls: ['./coordinate-picker-modal.component.scss'],
    imports: [FormsModule, DisplayModelValidationComponent, FormField],
})
export class CoordinatePickerModalComponent {
    activeModal = inject(NgbActiveModal);
    private readonly olMapManagerService = inject(OlMapManagerService);

    public readonly coordinatesModel = signal<OlMapCoordinatesInput>({
        longitude: '',
        latitude: '',
    });
    public readonly coordinatesForm = form(
        this.coordinatesModel,
        (schemaPath) => {
            validateStandardSchema(
                schemaPath,
                z.object({
                    longitude: coordinateStringSchema,
                    latitude: coordinateStringSchema,
                })
            );
        }
    );

    constructor() {
        effect(() => {
            if (
                this.olMapManagerService.olMapManager &&
                !this.coordinatesModel().longitude
            ) {
                const coordinates =
                    this.olMapManagerService.olMapManager.getLonLat();

                if (!coordinates) return;

                this.coordinatesModel.set(
                    olMapCoordinatesSchema.encode({
                        longitude: coordinates[0]!,
                        latitude: coordinates[1]!,
                    })
                );
            }
        });
    }

    public goToCoordinates() {
        this.olMapManagerService.olMapManager!.tryGoToCoordinates(
            olMapCoordinatesSchema.parse(this.coordinatesModel())
        );
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
