import { z } from 'zod';
import type { Immutable } from 'immer';
import type { TreatmentProgress } from '../utils/treatment.js';
import { treatmentProgressSchema } from '../utils/treatment.js';
import { simulationEventSchema } from './simulation-event.js';

export const treatmentProgressChangedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('treatmentProgressChangedEvent'),
    newProgress: treatmentProgressSchema,
});
export type TreatmentProgressChangedEvent = Immutable<
    z.infer<typeof treatmentProgressChangedEventSchema>
>;

export function newTreatmentProgressChangedEvent(
    newProgress: TreatmentProgress
): TreatmentProgressChangedEvent {
    return {
        type: 'treatmentProgressChangedEvent',
        newProgress,
    };
}
