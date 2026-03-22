import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const askForPatientDataEventSchema = simulationEventSchema.extend({
    type: z.literal('askForPatientDataEvent'),
    behaviorId: uuidSchema,
});
export type AskForPatientDataEvent = z.infer<
    typeof askForPatientDataEventSchema
>;

export function newAskForPatientDataEvent(
    behaviorId: UUID
): AskForPatientDataEvent {
    return {
        type: 'askForPatientDataEvent',
        behaviorId,
    };
}
