import { z } from 'zod';
import {
    transferDestinationTypeSchema,
    type TransferDestination,
} from '../utils/transfer-destination.js';
import {
    type ResourceDescription,
    resourceDescriptionSchema,
} from '../../models/utils/resource-description.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const requestReceivedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('requestReceivedEvent'),
    availableVehicles: resourceDescriptionSchema,
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
    key: z.string().optional(),
});
export type RequestReceivedEvent = z.infer<typeof requestReceivedEventSchema>;

export function newRequestReceivedEvent(
    availableVehicles: ResourceDescription,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    key?: string
): RequestReceivedEvent {
    return {
        type: 'requestReceivedEvent',
        availableVehicles,
        transferDestinationType,
        transferDestinationId,
        key,
    };
}
