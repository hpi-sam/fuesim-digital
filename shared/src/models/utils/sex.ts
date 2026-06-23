import { z } from 'zod';
import type { Immutable } from 'immer';

export const sexAllowedValues = ['diverse', 'female', 'male'] as const;

export const sexSchema = z.literal(sexAllowedValues);
export type Sex = Immutable<z.infer<typeof sexSchema>>;
