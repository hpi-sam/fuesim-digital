import z from 'zod';
import { uuidSchema } from '../utils/uuid.js';

export const evaluationCriterionSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('evaluationCriterion'),
    templateId: uuidSchema,
    /* TODO @JohannesPotzi @Jogius : add completion time? this could enable evaluation of first patient transport, aswell as timeline visuals.*/
});

export const globalMeasuresDoneCriteriaSchema =
    evaluationCriterionSchema.extend({
        /* TODO: measureSchema */
        target: z.int(),
        currentProgress: z.int(),
    });
