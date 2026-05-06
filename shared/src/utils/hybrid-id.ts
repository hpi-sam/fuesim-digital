import { z } from 'zod';
import { elementVersionIdSchema } from '../marketplace/models/versioned-id-schema.js';
import { uuidSchema } from './uuid.js';

export const hybridIdSchema = z.union([uuidSchema, elementVersionIdSchema]);

export type HybridId = z.infer<typeof hybridIdSchema>;
