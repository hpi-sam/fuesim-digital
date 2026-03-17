import { z } from 'zod';
import { uuidSchema } from './utils/index.js';

export const exerciseIdSchema = uuidSchema.brand<'ExerciseId'>();
export type ExerciseId = z.infer<typeof exerciseIdSchema>;

export const exerciseTemplateIdSchema = z
    .uuidv4()
    .brand<'ExerciseTemplateId'>();
export type ExerciseTemplateId = z.infer<typeof exerciseTemplateIdSchema>;

export const actionIdSchema = uuidSchema.brand<'ActionId'>();
export type ActionId = z.infer<typeof actionIdSchema>;
