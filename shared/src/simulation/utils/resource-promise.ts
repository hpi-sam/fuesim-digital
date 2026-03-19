import { z } from 'zod';
import type { VehicleResource } from '../../models/index.js';
import { vehicleResourceSchema } from '../../models/index.js';

export const resourcePromiseSchema = z.strictObject({
    type: z.literal('resourcePromise'),
    promisedTime: z.number().int().nonnegative(),
    resource: vehicleResourceSchema,
});

export type ResourcePromise = z.infer<typeof resourcePromiseSchema>;

export function newResourcePromise(
    promisedTime: number,
    resource: VehicleResource
): ResourcePromise {
    return {
        type: 'resourcePromise',
        promisedTime,
        resource,
    };
}
