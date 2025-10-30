import type { RestrictedZone } from '../models/index.js';
import type { UUID } from '../utils/uuid.js';
import type { UUIDSquaredMap } from '../utils/validators/is-uuid-uuid-map.js';
import type { Migration } from './migration-functions.js';

export const addRestrictedZones45: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            restrictedZones: { [key: UUID]: RestrictedZone };
            vehicleToRestrictedZone: UUIDSquaredMap;
            vehicles: { [key: UUID]: { restrictedZoneId?: UUID } };
        };
        typedState.restrictedZones = {};
        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.restrictedZoneId = undefined;
        });
    },
};
