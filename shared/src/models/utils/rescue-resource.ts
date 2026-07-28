import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    type ResourceDescription,
    resourceDescriptionSchema,
} from './resource-description.js';

export const vehicleResourceSchema = z.strictObject({
    type: z.literal('vehicleResource'),
    vehicleCounts: resourceDescriptionSchema,
});

export type VehicleResource = Immutable<z.infer<typeof vehicleResourceSchema>>;

export function newVehicleResource(
    vehicleCounts: ResourceDescription
): VehicleResource {
    return { type: 'vehicleResource', vehicleCounts };
}

export const personnelResourceSchema = z.strictObject({
    type: z.literal('personnelResource'),
    personnelCounts: resourceDescriptionSchema,
});

export type PersonnelResource = Immutable<
    z.infer<typeof personnelResourceSchema>
>;

export function newPersonnelResource(
    personnelCounts: ResourceDescription
): PersonnelResource {
    return { type: 'personnelResource', personnelCounts };
}

export const exerciseRescueResourceSchema = z.discriminatedUnion('type', [
    vehicleResourceSchema,
    personnelResourceSchema,
]);

export type ExerciseRescueResource = Immutable<
    z.infer<typeof exerciseRescueResourceSchema>
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
    return Object.values(resourceDescription).every((count) => count === 0);
}
