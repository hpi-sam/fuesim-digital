import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const tryToSendToHospitalEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('tryToSendToHospitalEvent'),
    behaviorId: uuidSchema,
});

export type TryToSendToHospitalEvent = Immutable<
    z.infer<typeof tryToSendToHospitalEventSchema>
>;

export function newTryToSendToHospitalEvent(
    behaviorId: UUID
): TryToSendToHospitalEvent {
    return { type: 'tryToSendToHospitalEvent', behaviorId };
}
