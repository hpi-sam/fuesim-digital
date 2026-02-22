import type { Immutable } from 'immer';
import type { z } from 'zod';

export type ImmutableInfer<T> = Immutable<z.infer<T>>;
