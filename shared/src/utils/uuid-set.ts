import * as z from 'zod';

export const uuidSetSchema = z.record(z.uuidv4(), z.literal(true));
export type UUIDSet = z.infer<typeof uuidSetSchema>;
