import { z } from 'zod';
import type { Immutable } from 'immer';

export const exerciseStatusAllowedValues = ['notStarted', 'paused', 'running'];

export const exerciseStatusSchema = z.literal(exerciseStatusAllowedValues);
export type ExerciseStatus = Immutable<z.infer<typeof exerciseStatusSchema>>;

export const exerciseTypeAllowedValues = ['standalone', 'template', 'parallel'];
export const exerciseTypeSchema = z.literal(exerciseTypeAllowedValues);
export type ExerciseType = Immutable<z.infer<typeof exerciseTypeSchema>>;
