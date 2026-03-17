import { z } from 'zod';

export const sexAllowedValues = ['diverse', 'female', 'male'] as const;

export const sexSchema = z.literal(sexAllowedValues);
export type Sex = z.infer<typeof sexSchema>;
