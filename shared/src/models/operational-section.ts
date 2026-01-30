import * as z from 'zod';
import { uuid } from '../utils/uuid.js';

export const operationalSectionSchema = z.object({
    type: z.literal('operationalSection'),
    id: z.uuidv4(),
    title: z.string().optional(),
});

export type OperationalSection = z.infer<typeof operationalSectionSchema>;
