import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { vehicleParametersSchema } from '../utils/vehicle-parameters.js';

export const alarmPropertyInstanceSchema = z.strictObject({
    type: z.literal('alarmInstance'),
    alarmGroup: uuidSchema,
    targetTransferPointId: uuidSchema,
    vehicleParameters: z.array(vehicleParametersSchema),
});

export type AlarmPropertyInstance = z.infer<typeof alarmPropertyInstanceSchema>;

export const eocLogPropertyInstanceSchema = z.strictObject({
    type: z.literal('eocLogInstance'),
    message: z.string(),
});

export type EocLogPropertyInstance = z.infer<
    typeof eocLogPropertyInstanceSchema
>;

export const drawingPropertyInstanceSchema = z.strictObject({
    type: z.literal('drawingInstance'),
    id: uuidSchema,
});

export type DrawingPropertyInstance = z.infer<
    typeof drawingPropertyInstanceSchema
>;

// ==================================================

export const measurePropertyInstanceSchema = z.union([
    alarmPropertyInstanceSchema,
    eocLogPropertyInstanceSchema,
    drawingPropertyInstanceSchema,
]);

export type MeasurePropertyInstance = z.infer<
    typeof measurePropertyInstanceSchema
>;
