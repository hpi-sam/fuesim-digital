import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    type VehicleResource,
    vehicleResourceSchema,
} from '../../models/utils/rescue-resource.js';

export const resourcePromiseSchema = z.strictObject({
    type: z.literal('resourcePromise'),
    promisedTime: z.int().nonnegative(),
    resource: vehicleResourceSchema,
});

export type ResourcePromise = Immutable<z.infer<typeof resourcePromiseSchema>>;

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
