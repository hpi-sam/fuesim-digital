import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectVehiclesInTransfer } from '../../../../../../../state/application/selectors/exercise.selectors';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import { selectVisibleVehicles } from '../../../../../../../state/application/selectors/shared.selectors';
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

    private readonly visibleVehiclesMap = this.store.selectSignal(
        selectVisibleVehicles
    );
    private readonly visibleVehicles = computed(() =>
        Object.values(this.visibleVehiclesMap())
    );
    private readonly vehiclesInBetweenTransferpointsMap =
        this.store.selectSignal(selectVehiclesInTransfer);
    private readonly vehiclesInBetweenTransferpoints = computed(() =>
        Object.values(this.vehiclesInBetweenTransferpointsMap()).filter(
            (vehicle) =>
                vehicle.position.type === 'transfer' &&
                vehicle.position.transfer.startPoint.type ===
                    'transferStartPoint'
        )
    );

    public readonly vehicles = computed(() => {
        const data = [
            ...this.visibleVehicles(),
            ...this.vehiclesInBetweenTransferpoints(),
        ];

        data.sort((a, b) => a.name.localeCompare(b.name));

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
