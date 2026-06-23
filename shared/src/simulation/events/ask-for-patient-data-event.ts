import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const askForPatientDataEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('askForPatientDataEvent'),
    behaviorId: uuidSchema,
});
export type AskForPatientDataEvent = Immutable<
    z.infer<typeof askForPatientDataEventSchema>
>;

export function newAskForPatientDataEvent(
    behaviorId: UUID
): AskForPatientDataEvent {
    return {
        type: 'askForPatientDataEvent',
        behaviorId,
    };
}
