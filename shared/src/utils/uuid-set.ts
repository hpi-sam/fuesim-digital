import * as z from 'zod';
import { uuidSchema } from './uuid.js';

export const uuidSetSchema = z.record(uuidSchema, z.literal(true));
export type UUIDSet = z.infer<typeof uuidSetSchema>;
