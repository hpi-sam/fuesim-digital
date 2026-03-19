import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { VehicleResource } from '../../models/utils/rescue-resource.js';
import { vehicleResourceSchema } from '../../models/utils/rescue-resource.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehicleTransferSuccessfulEventSchema =
    simulationEventSchema.extend({
        type: z.literal('vehicleTransferSuccessfulEvent'),
        targetId: uuidSchema,
        key: z.string(),
        vehiclesSent: vehicleResourceSchema,
    });
export type VehicleTransferSuccessfulEvent = z.infer<
    typeof vehicleTransferSuccessfulEventSchema
>;

export function newVehicleTransferSuccessfulEvent(
    targetId: UUID,
    key: string,
    vehiclesSent: VehicleResource
): VehicleTransferSuccessfulEvent {
    return {
        type: 'vehicleTransferSuccessfulEvent',
        targetId,
        key,
        vehiclesSent,
    };
}
