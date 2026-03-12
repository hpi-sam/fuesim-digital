import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { currentTransferOf, UUID } from 'fuesim-digital-shared';
import { groupBy } from 'lodash-es';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    selectCurrentTime,
    selectVehiclesInTransfer,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../../state/get-state-snapshot';

interface ArrivingVehicle {
    id: UUID;
    name: string;
    vehicleType: string;
    remainingMinutes: number;
}

@Component({
    selector: 'app-signaller-modal-eoc-information-arriving-vehicles',
    templateUrl:
        './signaller-modal-eoc-information-arriving-vehicles.component.html',
    styleUrls: [
        './signaller-modal-eoc-information-arriving-vehicles.component.scss',
    ],
})
export class SignallerModalEocInformationArrivingVehiclesComponent {
    arrivingVehicles: ArrivingVehicle[];

    public get arrivingVehicleGroups() {
        return Object.entries(
            groupBy(
                this.arrivingVehicles,
                (arrivingVehicle) => arrivingVehicle.vehicleType
            )
        ).map(([type, vehicles]) => ({ type, count: vehicles.length }));
    }

    constructor() {
        const store = inject<Store<AppState>>(Store);

        const currentTime = selectStateSnapshot(selectCurrentTime, store);

        this.arrivingVehicles = selectStateSnapshot(
            selectVehiclesInTransfer,
            store
        )
            .map((vehicle) => ({
                vehicle,
                transfer: currentTransferOf(vehicle),
            }))
            .filter(
                (vehicleTransfer) =>
                    vehicleTransfer.transfer.startPoint.type ===
                    'alarmGroupStartPoint'
            )
            .map((vehicleTransfer) => ({
                id: vehicleTransfer.vehicle.id,
                name: vehicleTransfer.vehicle.name,
                vehicleType: vehicleTransfer.vehicle.vehicleType,
                remainingMinutes: Math.ceil(
                    (vehicleTransfer.transfer.endTimeStamp - currentTime) /
                        1000 /
                        60
                ),
            }))
            .sort((a, b) => a.remainingMinutes - b.remainingMinutes);
    }
}
