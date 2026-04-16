import type { AlarmGroup } from 'fuesim-digital-shared';
import {
    createVehicleParameters,
    newMapCoordinatesAt,
    uuid,
} from 'fuesim-digital-shared';
import type { Store } from '@ngrx/store';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
    selectVehicleTemplates,
} from '../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../state/get-state-snapshot';
import type { AppState } from '../../state/app.state';

export function getVehicleParameters(
    store: Store<AppState>,
    alarmGroup: AlarmGroup
) {
    const vehicleTemplates = selectStateSnapshot(selectVehicleTemplates, store);

    const materialTemplates = selectStateSnapshot(
        selectMaterialTemplates,
        store
    );
    const personnelTemplates = selectStateSnapshot(
        selectPersonnelTemplates,
        store
    );

    const sortedAlarmGroupVehicles = Object.values(
        alarmGroup.alarmGroupVehicles
    ).sort((a, b) => a.time - b.time);

    // We have to provide a map position when creating a vehicle
    // It will be overwritten directly after by putting the vehicle into transfer
    const placeholderPosition = newMapCoordinatesAt(0, 0);

    // Create vehicle parameters for the alarm group
    // This has to be done in the frontend to ensure the UUIDs of the vehicles, material, and personnel are consistent across all clients
    const vehicleParameters = sortedAlarmGroupVehicles.map(
        (alarmGroupVehicle) =>
            createVehicleParameters(
                uuid(),
                {
                    ...vehicleTemplates[alarmGroupVehicle.vehicleTemplateId]!,
                    name: alarmGroupVehicle.name,
                },
                materialTemplates,
                personnelTemplates,
                placeholderPosition
            )
    );

    return vehicleParameters;
}
