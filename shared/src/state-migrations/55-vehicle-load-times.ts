import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface VehicleTemplate {
    patientLoadMinutes?: number;
}

interface Vehicle {
    patientLoadMinutes?: number;
    patientLoadTimes?: {
        [key: UUID]: number;
    };
}

interface VehicleParameters {
    vehicle: Vehicle;
}

type Action =
    | {
          type: '[DUMMY]';
      }
    | {
          type: '[Emergency Operation Center] Send Alarm Group';
          sortedVehicleParameters: VehicleParameters[];
      }
    | {
          type: '[Vehicle] Add vehicle';
          vehicleParameters: VehicleParameters;
      }
    | {
          type: '[VehicleTemplate] Add vehicleTemplate';
          vehicleTemplate: VehicleTemplate;
      }
    | {
          type: '[VehicleTemplate] Edit vehicleTemplate';
          patientLoadMinutes?: number;
      };

export const vehicleLoadTimes55: Migration = {
    action: (_, action) => {
        const typedAction = action as Action;
        switch (typedAction.type) {
            case '[Emergency Operation Center] Send Alarm Group': {
                typedAction.sortedVehicleParameters.forEach(
                    (vehicleParameters) => {
                        vehicleParameters.vehicle.patientLoadMinutes = 2;
                        vehicleParameters.vehicle.patientLoadTimes = {};
                    }
                );
                break;
            }
            case '[Vehicle] Add vehicle': {
                typedAction.vehicleParameters.vehicle.patientLoadMinutes = 2;
                typedAction.vehicleParameters.vehicle.patientLoadTimes = {};
                break;
            }
            case '[VehicleTemplate] Add vehicleTemplate': {
                typedAction.vehicleTemplate.patientLoadMinutes = 2;
                break;
            }
            case '[VehicleTemplate] Edit vehicleTemplate': {
                // We don't have to care about previous edits, since this is a new property.
                // Hence, we can always assign the default value.
                typedAction.patientLoadMinutes = 2;
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            vehicles: {
                [key: UUID]: Vehicle;
            };
            vehicleTemplates: {
                [key: UUID]: VehicleTemplate;
            };
            configuration: {
                vehicleLoadTimesEnabled?: boolean;
            };
        };

        // We want to preserve the old behavior, so load times should be disabled
        typedState.configuration.vehicleLoadTimesEnabled = false;

        // Since we globally disable load times, we can assign sensible defaults here
        Object.values(typedState.vehicleTemplates).forEach(
            (template) => (template.patientLoadMinutes = 2)
        );
        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.patientLoadMinutes = 2;
            vehicle.patientLoadTimes = {};
        });
    },
};
