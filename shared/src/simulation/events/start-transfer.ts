import { z } from 'zod';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from '../../models/utils/occupations/exercise-occupation.js';
import { simulationEventSchema } from './simulation-event.js';

export const startTransferEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
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
