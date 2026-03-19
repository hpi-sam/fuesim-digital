import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const tryToSendToHospitalEventSchema = simulationEventSchema.extend({
    type: z.literal('tryToSendToHospitalEvent'),
    behaviorId: uuidSchema,
});

export type TryToSendToHospitalEvent = z.infer<
    typeof tryToSendToHospitalEventSchema
>;

export function newTryToSendToHospitalEvent(
    behaviorId: UUID
): TryToSendToHospitalEvent {
    return { type: 'tryToSendToHospitalEvent', behaviorId };
}
