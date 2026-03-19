import { z } from 'zod';
import type { ResourceDescription } from '../../models/index.js';
import { resourceDescriptionSchema } from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import {
    transferDestinationTypeSchema,
    type TransferDestination,
} from '../utils/transfer-destination.js';
import { simulationEventSchema } from './simulation-event.js';

export const requestReceivedEventSchema = simulationEventSchema.extend({
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
