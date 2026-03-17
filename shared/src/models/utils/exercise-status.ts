import { z } from 'zod';

export const exerciseStatusAllowedValues = ['notStarted', 'paused', 'running'];

export const exerciseStatusSchema = z.literal(exerciseStatusAllowedValues);
export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;
