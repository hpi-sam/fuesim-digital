import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { vehicleParametersSchema } from '../utils/vehicle-parameters.js';
import { alarmGroupSchema } from '../alarm-group.js';
import { transferPointSchema } from '../transfer-point.js';

const alarmPropertyInstanceSchema = z.strictObject({
    type: z.literal('alarmInstance'),
    alarmGroup: alarmGroupSchema.shape.id,
    targetTransferPointId: transferPointSchema.shape.id,
    vehicleParameters: z.array(vehicleParametersSchema),
});

const eocLogPropertyInstanceSchema = z.strictObject({
    type: z.literal('eocLogInstance'),
    message: z.string(),
});

const drawingPropertyInstanceSchema = z.strictObject({
    type: z.literal('drawingInstance'),
    id: uuidSchema,
});

export const measurePropertyInstanceSchema = z.discriminatedUnion('type', [
    alarmPropertyInstanceSchema,
    eocLogPropertyInstanceSchema,
    drawingPropertyInstanceSchema,
]);

export type MeasurePropertyInstance = z.infer<
    typeof measurePropertyInstanceSchema
>;
