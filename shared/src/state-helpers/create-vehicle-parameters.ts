import type {
    Vehicle,
    VehicleTemplate,
    MaterialTemplate,
    PersonnelTemplate,
    MapCoordinates,
    VehicleParameters,
    VersionedElementPartial,
} from '../models/index.js';
import {
    newVehicleParameters,
    newNoOccupation,
    newVehiclePositionIn,
    newMapPositionAt,
} from '../models/index.js';

import { arrayToUUIDSet } from '../utils/array-to-uuid-set.js';
import { newMaterialFromTemplate } from '../models/material.js';
import { newPersonnelFromTemplate } from '../models/personnel.js';
import type { UUID } from '../utils/uuid.js';
import type { VehicleTemplate } from '../models/vehicle-template.js';
import type { MapCoordinates } from '../models/utils/position/map-coordinates.js';
import {
    newVehicleParameters,
    type VehicleParameters,
} from '../models/utils/vehicle-parameters.js';
import { newVehiclePositionIn } from '../models/utils/position/vehicle-position.js';
import type { Vehicle } from '../models/vehicle.js';
import { newMapPositionAt } from '../models/utils/position/map-position.js';
import { newNoOccupation } from '../models/utils/occupations/no-occupation.js';
import type { MaterialTemplate } from '../models/material-template.js';
import type { PersonnelTemplate } from '../models/personnel-template.js';

/**
 * @returns a vehicle with personnel and materials to be added to the map
 */
// Be aware that `uuid()` is nondeterministic and cannot be used in a reducer function.
export function createVehicleParameters(
    vehicleId: UUID,
    vehicleTemplate: VehicleTemplate,
    materialTemplates: { readonly [key in UUID]: MaterialTemplate },
    personnelTemplates: { readonly [key in UUID]: PersonnelTemplate },
    vehiclePosition: MapCoordinates,
    entityVersion?: VersionedElementPartial
): VehicleParameters {
    console.log(entityVersion);
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
        entityId: entityVersion?.entityId,
        versionId: entityVersion?.versionId,
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
