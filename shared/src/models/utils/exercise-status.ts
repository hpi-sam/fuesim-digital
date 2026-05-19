import { z } from 'zod';

export const exerciseStatusAllowedValues = [
    'notStarted',
    'paused',
    'running',
] as const;

export const exerciseStatusSchema = z.literal(exerciseStatusAllowedValues);
export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;

export const exerciseTypeAllowedValues = [
    'standalone',
    'template',
    'parallel',
] as const;
export const exerciseTypeSchema = z.literal(exerciseTypeAllowedValues);
export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
