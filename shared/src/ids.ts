import { z } from 'zod';
import { uuidSchema } from './utils/uuid.js';

export const exerciseIdSchema = uuidSchema.brand<'ExerciseId'>();
export type ExerciseId = z.infer<typeof exerciseIdSchema>;

export const exerciseTemplateIdSchema = z
    .uuidv4()
    .brand<'ExerciseTemplateId'>();
export type ExerciseTemplateId = z.infer<typeof exerciseTemplateIdSchema>;

export const actionIdSchema = uuidSchema.brand<'ActionId'>();
export type ActionId = z.infer<typeof actionIdSchema>;

export const parallelExerciseIdSchema = z
    .uuidv4()
    .brand<'ParallelExerciseId'>();
export type ParallelExerciseId = z.infer<typeof parallelExerciseIdSchema>;
