import type { Vehicle, VehicleTemplate } from '../models/index.js';
import { VehicleParameters, Material, Personnel } from '../models/index.js';
import type { MaterialTemplate } from '../models/material-template.js';
import type { PersonnelTemplate } from '../models/personnel-template.js';
import type { MapCoordinates } from '../models/utils/index.js';
import { MapPosition } from '../models/utils/position/map-position.js';
import { VehiclePosition } from '../models/utils/position/vehicle-position.js';

import { arrayToUUIDSet } from '../utils/array-to-uuid-set.js';
import { NoOccupation } from '../models/utils/occupations/no-occupation.js';
import type { UUID } from '../utils/index.js';

/**
 * @returns a vehicle with personnel and materials to be added to the map
 */
// Be aware that `uuid()` is nondeterministic and cannot be used in a reducer function.
export function createVehicleParameters(
    vehicleId: UUID,
    vehicleTemplate: VehicleTemplate,
    materialTemplates: { readonly [key in UUID]: MaterialTemplate },
    personnelTemplates: { readonly [key in UUID]: PersonnelTemplate },
    vehiclePosition: MapCoordinates
): VehicleParameters {
    const materials = vehicleTemplate.materialTemplateIds
        .map((materialTemplateId: UUID) => {
            const materialTemplate = materialTemplates[materialTemplateId];
            if (!materialTemplate) return null;
            return Material.generateMaterial(
                materialTemplate,
                vehicleId,
                vehicleTemplate.name,
                VehiclePosition.create(vehicleId)
            );
        })
        .filter((val) => val !== null);
    const personnel = vehicleTemplate.personnelTemplateIds
        .map((personnelTemplateId: UUID) => {
            const personnelTemplate = personnelTemplates[personnelTemplateId];
            if (!personnelTemplate) return null;
            return Personnel.generatePersonnel(
                personnelTemplate,
                vehicleId,
                vehicleTemplate.name,
                VehiclePosition.create(vehicleId)
            );
        })
        .filter((val) => val !== null);

    const vehicle: Vehicle = {
        id: vehicleId,
        type: 'vehicle',
        templateId: vehicleTemplate.id,
        materialIds: arrayToUUIDSet(materials.map((m) => m.id)),
        vehicleType: vehicleTemplate.vehicleType,
        name: vehicleTemplate.name,
        patientCapacity: vehicleTemplate.patientCapacity,
        image: vehicleTemplate.image,
        patientIds: {},
        personnelIds: arrayToUUIDSet(personnel.map((p) => p.id)),
        position: MapPosition.create(vehiclePosition),
        occupation: NoOccupation.create(),
    };

    return VehicleParameters.create(vehicle, materials, personnel);
}
