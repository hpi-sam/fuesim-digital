import type { Immutable } from 'immer';
import { z } from 'zod';

// This is a placeholder for the Marketplace FULL Version
export const changeApplySchema = z.undefined().nullable();
export type ChangeApply = Immutable<z.infer<typeof changeApplySchema>>;
