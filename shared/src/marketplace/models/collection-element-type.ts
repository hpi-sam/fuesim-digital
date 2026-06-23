import { z } from 'zod';

export const collectionElementTypeSchema = z.union([
    z.literal('direct'),
    z.literal('imported'),
    z.literal('references'),
]);

export type CollectionElementType = z.infer<typeof collectionElementTypeSchema>;
