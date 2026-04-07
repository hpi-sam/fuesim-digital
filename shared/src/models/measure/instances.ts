import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../utils/index.js';
import { drawingTypeSchema } from '../drawing.js';

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

export const drawingPropertyInstanceSchema = z.strictObject({
    type: z.literal('drawingInstance'),
    drawingType: drawingTypeSchema,
    points: z.array(mapCoordinatesSchema),
    strokeColor: z.string(),
    fillColor: z.string().optional(),
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
