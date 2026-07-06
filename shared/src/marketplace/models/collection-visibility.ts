import { z } from 'zod';

export const collectionVisibilityValues = [
    'public',
    'private',
    'embedded',
] as const;

// This is typed separately in case we ever want to have a more complex visibility type
export const collectionVisibilitySchema = z.union(
    collectionVisibilityValues.map((value) => z.literal(value))
);

export type CollectionVisibility = z.infer<typeof collectionVisibilitySchema>;
