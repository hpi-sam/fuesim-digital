import { z } from 'zod';
import type { Immutable } from 'immer';
import type { Personnel } from '../personnel.js';
import { personnelSchema } from '../personnel.js';
import type { Vehicle } from '../vehicle.js';
import { vehicleSchema } from '../vehicle.js';
import type { Material } from '../material.js';
import { materialSchema } from '../material.js';

export const vehicleParametersSchema = z.strictObject({
    vehicle: vehicleSchema,
    materials: z.array(materialSchema),
    personnel: z.array(personnelSchema),
});
export type VehicleParameters = Immutable<
    z.infer<typeof vehicleParametersSchema>
>;

export function newVehicleParameters(
    vehicle: Vehicle,
    materials: Material[],
    personnel: Personnel[]
): VehicleParameters {
    return { vehicle, materials, personnel };
}
