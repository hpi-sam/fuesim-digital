import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const alarmPropertyInstanceSchema = z.strictObject({
    type: z.literal('alarmInstance'),
    alarmGroup: uuidSchema,
    targetTransferPointId: uuidSchema,
});

export type AlarmPropertyInstance = z.infer<typeof alarmPropertyInstanceSchema>;

export const eocLogPropertyInstanceSchema = z.strictObject({
    type: z.literal('eocLogInstance'),
    message: z.string(),
});

export type EocLogPropertyInstance = z.infer<
    typeof eocLogPropertyInstanceSchema
>;

// ==================================================

export const measurePropertyInstanceSchema = z.union([
    alarmPropertyInstanceSchema,
    eocLogPropertyInstanceSchema,
]);

export type MeasurePropertyInstance = z.infer<
    typeof measurePropertyInstanceSchema
>;
