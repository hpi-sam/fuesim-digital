import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectVehiclesOnOperationsLocation } from '../../../../../../../state/application/selectors/exercise.selectors';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import { VehiclesZoneComponent } from '../vehicles-zone/vehicles-zone.component';

@Component({
    selector: 'app-vehicles-on-location',
    templateUrl: './vehicles-on-location.component.html',
    styleUrl: './vehicles-on-location.component.scss',
    imports: [VehiclesZoneComponent],
})
export class VehiclesOnLocationComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject(Store<AppState>);

    private readonly vehiclesOnLocationMap = this.store.selectSignal(
        selectVehiclesOnOperationsLocation
    );
    public readonly vehiclesOnLocation = computed(() => {
        const data = Object.values(this.vehiclesOnLocationMap()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        return data.filter((vehicle) => vehicle.operationalAssignment === null);
    });

    public onVehicleDropped(vehicleId: string) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: null,
                vehicleId,
                assignAsSectionLeader: false,
                position: undefined,
            },
            true
        );
    }
}
