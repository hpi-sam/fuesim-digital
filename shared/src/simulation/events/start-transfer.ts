import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import type { ExerciseOccupation } from '../../models/index.js';
import { exerciseOccupationSchema } from '../../models/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const startTransferEventSchema = simulationEventSchema.extend({
    type: z.literal('startTransferEvent'),
    vehicleId: uuidSchema,
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
    key: z.string().optional(),
    successorOccupation: exerciseOccupationSchema.optional(),
});

export type StartTransferEvent = z.infer<typeof startTransferEventSchema>;

export function newStartTransferEvent(
    vehicleId: UUID,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    key?: string,
    successorOccupation?: ExerciseOccupation
): StartTransferEvent {
    return {
        type: 'startTransferEvent',
        vehicleId,
        transferDestinationType,
        transferDestinationId,
        key,
        successorOccupation,
    };
}
