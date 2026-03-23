import { z } from 'zod';
import { simulationEventSchema } from './simulation-event.js';

export const treatmentsTimerEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('treatmentsTimerEvent'),
});
export type TreatmentsTimerEvent = z.infer<typeof treatmentsTimerEventSchema>;

export function newTreatmentsTimerEvent(): TreatmentsTimerEvent {
    return { type: 'treatmentsTimerEvent' };
}
