import { Component, computed, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { isInSpecificVehicle } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import {
    createSelectVehicle,
    createSelectMaterial,
    createSelectPersonnel,
    createSelectPatient,
    selectConfiguration,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-vehicle-load-unload-controls',
    templateUrl: './vehicle-load-unload-controls.component.html',
    styleUrls: ['./vehicle-load-unload-controls.component.scss'],
})
export class VehicleLoadUnloadControlsComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    public readonly vehicleId = input.required<UUID>();

    protected readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    protected readonly participantLoadAllEnabled = this.store.selectSignal(
        createSelector(
            selectConfiguration,
            (configuration) => configuration.participantLoadAllEnabled
        )
    );

    protected readonly vehicle = computed(() =>
        this.store.selectSignal(createSelectVehicle(this.vehicleId()))()
    );
    protected readonly vehicleLoadState = computed(() => {
        const materialInVehicle = Object.keys(this.vehicle().materialIds)
            .map((materialId) =>
                this.store.selectSignal(createSelectMaterial(materialId))()
            )
            .map((material) =>
                isInSpecificVehicle(material, this.vehicle().id)
            );
        const personnelInVehicle = Object.keys(this.vehicle().personnelIds)
            .map((personnelId) =>
                this.store.selectSignal(createSelectPersonnel(personnelId))()
            )
            .map((personnel) =>
                isInSpecificVehicle(personnel, this.vehicle().id)
            );
        const patientsInVehicle = Object.keys(this.vehicle().patientIds)
            .map((patientId) =>
                this.store.selectSignal(createSelectPatient(patientId))()
            )
            .map((patient) => isInSpecificVehicle(patient, this.vehicle().id));

        const elementsInVehicle = [
            ...materialInVehicle,
            ...personnelInVehicle,
            ...patientsInVehicle,
        ];

        return {
            loadable: elementsInVehicle.some((isInVehicle) => !isInVehicle),
            unloadable: elementsInVehicle.some((isInVehicle) => isInVehicle),
        };
    });

    public unloadVehicle() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Unload vehicle',
            vehicleId: this.vehicleId(),
        });
    }

    public loadVehicle() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Completely load vehicle',
            vehicleId: this.vehicleId(),
        });
    }
}
