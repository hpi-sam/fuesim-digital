import type {
    Vehicle,
    VehicleTemplate,
    MaterialTemplate,
    PersonnelTemplate,
    MapCoordinates,
    VehicleParameters,
} from '../models/index.js';
import {
    newVehicleParameters,
    newNoOccupation,
    newVehiclePositionIn,
    newMapPositionAt,
} from '../models/index.js';

import { arrayToUUIDSet } from '../utils/array-to-uuid-set.js';
import type { UUID } from '../utils/index.js';
import { newMaterialFromTemplate } from '../models/material.js';
import { newPersonnelFromTemplate } from '../models/personnel.js';

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
            return newMaterialFromTemplate(
                materialTemplate,
                vehicleId,
                vehicleTemplate.name,
                newVehiclePositionIn(vehicleId)
            );
        })
        .filter((val) => val !== null);
    const personnel = vehicleTemplate.personnelTemplateIds
        .map((personnelTemplateId: UUID) => {
            const personnelTemplate = personnelTemplates[personnelTemplateId];
            if (!personnelTemplate) return null;
            return newPersonnelFromTemplate(
                personnelTemplate,
                vehicleId,
                vehicleTemplate.name,
                newVehiclePositionIn(vehicleId)
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
        position: newMapPositionAt(vehiclePosition),
        occupation: newNoOccupation(),
        operationalAssignment: null,
    };

    return newVehicleParameters(vehicle, materials, personnel);
}
