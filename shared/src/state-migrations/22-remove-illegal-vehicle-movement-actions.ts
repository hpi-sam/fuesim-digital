import { isCompletelyLoaded } from '../store/action-reducers/utils/completely-load-vehicle.js';
import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

/**
 * We prevent users to perform some actions on vehicles to enforce the connection between personnel, material and vehicles.
 * Therefore, these action might become illegal. To keep most value of the exports, we delete these actions.
 * Some vehicles will thus stay on the map even though they had been send away in the original session.
 */
export const removeIllegalVehicleMovementActions22: Migration = {
    action: (intermediaryState, action) => {
        const typedState = intermediaryState as {
            vehicles: {
                [vehicleId in UUID]: any;
            };
        };

        switch ((action as { type: string }).type) {
            case '[Hospital] Transport patient to hospital': {
                const { vehicleId } = action as { vehicleId: UUID };

                const vehicle = typedState.vehicles[vehicleId];

                return isCompletelyLoaded(
                    // @ts-expect-error: TODO: Refactor to not require ExerciseState & external dependencies
                    intermediaryState,
                    vehicle
                );
            }
            case '[SimulatedRegion] Add Element': {
                const { elementToBeAddedType, elementToBeAddedId } = action as {
                    elementToBeAddedType: string;
                    elementToBeAddedId: UUID;
                };
                if (elementToBeAddedType === 'vehicle') {
                    const vehicle = typedState.vehicles[elementToBeAddedId];
                    return isCompletelyLoaded(
                        // @ts-expect-error: TODO: Refactor to not require ExerciseState & external dependencies
                        intermediaryState,
                        vehicle
                    );
                }
            }
        }
        return true;
    },
    state: null,
};
