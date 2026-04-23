import { z } from 'zod';

// This is typed separately in case we ever want to have a more complex visibility type
export const collectionVisibilitySchema = z.string();

export type CollectionVisibility = z.infer<typeof collectionVisibilitySchema>;
