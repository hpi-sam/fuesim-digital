import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

interface VehicleParameters {
    vehicle: {
        operationalAssignment?: null;
    };
}

export const addOperationsTabletView49: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Vehicle] Add vehicle': {
                const typedVehicleAction = action as {
                    vehicleParameters: VehicleParameters;
                };
                typedVehicleAction.vehicleParameters.vehicle.operationalAssignment =
                    null;
                break;
            }
            case '[Emergency Operation Center] Send Alarm Group': {
                const typedVehicleAction = action as {
                    sortedVehicleParameters: VehicleParameters[];
                };
                typedVehicleAction.sortedVehicleParameters.forEach(
                    (vehicleParameters) => {
                        vehicleParameters.vehicle.operationalAssignment = null;
                    }
                );
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            operationalSections: { [key in UUID]: any } | undefined;
            vehicles: {
                [key in UUID]: {
                    operationalAssignment: null | undefined;
                };
            };
        };

        typedState.operationalSections = {};
        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.operationalAssignment = null;
        });
    },
};
