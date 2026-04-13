import type { WritableDraft } from 'immer';
import { isCompletelyLoaded } from '../store/action-reducers/utils/completely-load-vehicle.js';
import type { ExerciseState } from '../state.js';
import type { UUID } from '../utils/uuid.js';
import { getElement } from '../store/action-reducers/utils/get-element.js';
import type { Migration } from './migration-functions.js';
import { Writeable } from 'zod/v3';
import { Vehicle } from '../models/vehicle.js';

/**
 * We prevent users to perform some actions on vehicles to enforce the connection between personnel, material and vehicles.
 * Therefore, these action might become illegal. To keep most value of the exports, we delete these actions.
 * Some vehicles will thus stay on the map even though they had been send away in the original session.
 */
export const removeIllegalVehicleMovementActions22: Migration = {
    action: (intermediaryState, action) => {
        switch ((action as { type: string }).type) {
            case '[Hospital] Transport patient to hospital': {
                const { vehicleId } = action as { vehicleId: UUID };
                const vehicle = getElement(
                    intermediaryState,
                    'vehicle',
                    vehicleId
                ) as WritableDraft<Vehicle>;
                return isCompletelyLoaded(
                    intermediaryState as WritableDraft<ExerciseState>,
                    vehicle
                );
            }
            case '[SimulatedRegion] Add Element': {
                const { elementToBeAddedType, elementToBeAddedId } = action as {
                    elementToBeAddedType: string;
                    elementToBeAddedId: UUID;
                };
                if (elementToBeAddedType === 'vehicle') {
                    const vehicle = getElement(
                        intermediaryState,
                        'vehicle',
                        elementToBeAddedId
                    ) as WritableDraft<Vehicle>;
                    return isCompletelyLoaded(
                        intermediaryState as WritableDraft<ExerciseState>,
                        vehicle
                    );
                }
            }
        }
        return true;
    },
    state: null,
};
