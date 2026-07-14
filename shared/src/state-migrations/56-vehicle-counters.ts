import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface VehicleTemplate {
    name: string;
}

type Action =
    | {
          type: '[VehicleTemplate] Add vehicleTemplate';
          vehicleTemplate: VehicleTemplate;
      }
    | { type: '[DUMMY]' }
    | { type: '[VehicleTemplate] Edit vehicleTemplate'; name: string };

export const vehicleCounters56: Migration = {
    action: (_, action) => {
        const typedAction = action as Action;
        switch (typedAction.type) {
            case '[VehicleTemplate] Add vehicleTemplate':
                migrateVehicleTemplate(typedAction.vehicleTemplate);
                break;
            case '[VehicleTemplate] Edit vehicleTemplate':
                migrateVehicleTemplate(typedAction);
                break;
            default:
                break;
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            vehicleCounters?: {
                [key: UUID]: number;
            };
            vehicleTemplates: {
                [key: UUID]: VehicleTemplate;
            };
        };

        typedState.vehicleCounters = {};
        Object.values(typedState.vehicleTemplates).forEach((vehicleTemplate) =>
            migrateVehicleTemplate(vehicleTemplate)
        );
    },
};

function migrateVehicleTemplate(vehicleTemplate: VehicleTemplate) {
    vehicleTemplate.name = vehicleTemplate.name.replaceAll('???', '#');
}
