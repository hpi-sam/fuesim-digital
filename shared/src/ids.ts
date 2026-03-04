import { z } from 'zod';

export const exerciseIdSchema = z.uuidv4().brand<'ExerciseId'>();
export type ExerciseId = z.infer<typeof exerciseIdSchema>;

export const exerciseTemplateIdSchema = z
    .uuidv4()
    .brand<'ExerciseTemplateId'>();
export type ExerciseTemplateId = z.infer<typeof exerciseTemplateIdSchema>;

export const actionIdSchema = z.uuidv4().brand<'ActionId'>();
export type ActionId = z.infer<typeof actionIdSchema>;
