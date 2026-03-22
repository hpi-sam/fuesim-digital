import { z } from 'zod';
import { StrictObject } from '../../utils/strict-object.js';
import {
    type ResourceDescription,
    resourceDescriptionSchema,
} from './resource-description.js';

export const rescueResourceSchema = z.strictObject({
    type: z.literal('RescueResource'),
});

export const vehicleResourceSchema = rescueResourceSchema.extend({
    type: z.literal('vehicleResource'),
    vehicleCounts: resourceDescriptionSchema,
});

export type VehicleResource = z.infer<typeof vehicleResourceSchema>;

export function newVehicleResource(
    vehicleCounts: ResourceDescription
): VehicleResource {
    return { type: 'vehicleResource', vehicleCounts };
}

export const personnelResourceSchema = z.strictObject({
    type: z.literal('personnelResource'),
    personnelCounts: resourceDescriptionSchema,
});

export type PersonnelResource = z.infer<typeof personnelResourceSchema>;

export function newPersonnelResource(
    personnelCounts: ResourceDescription
): PersonnelResource {
    return { type: 'personnelResource', personnelCounts };
}

export const exerciseRescueResourceSchema = z.discriminatedUnion('type', [
    vehicleResourceSchema,
    personnelResourceSchema,
]);

export type ExerciseRescueResource = z.infer<
    typeof exerciseRescueResourceSchema
>;

export function isEmptyResource(resource: ExerciseRescueResource) {
    let resourceDescription: ResourceDescription;
    switch (resource.type) {
        case 'personnelResource':
            resourceDescription = resource.personnelCounts;
            break;
        case 'vehicleResource':
            resourceDescription = resource.vehicleCounts;
            break;
    }
    return StrictObject.values(resourceDescription).every(
        (count) => count === 0
    );
}
