import { z } from 'zod';
import type { TreatmentProgress } from '../utils/treatment.js';
import { treatmentProgressSchema } from '../utils/treatment.js';
import { simulationEventSchema } from './simulation-event.js';

export const treatmentProgressChangedEventSchema = simulationEventSchema.extend(
    {
        type: z.literal('treatmentProgressChangedEvent'),
        newProgress: treatmentProgressSchema,
    }
);
export type TreatmentProgressChangedEvent = z.infer<
    typeof treatmentProgressChangedEventSchema
>;

export function newTreatmentProgressChangedEvent(
    newProgress: TreatmentProgress
): TreatmentProgressChangedEvent {
    return {
        type: 'treatmentProgressChangedEvent',
        newProgress,
    };
}
