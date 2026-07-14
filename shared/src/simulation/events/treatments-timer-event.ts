import { z } from 'zod';
import type { Immutable } from 'immer';
import { simulationEventSchema } from './simulation-event.js';

export const treatmentsTimerEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('treatmentsTimerEvent'),
});
export type TreatmentsTimerEvent = Immutable<
    z.infer<typeof treatmentsTimerEventSchema>
>;

export function newTreatmentsTimerEvent(): TreatmentsTimerEvent {
    return { type: 'treatmentsTimerEvent' };
}
