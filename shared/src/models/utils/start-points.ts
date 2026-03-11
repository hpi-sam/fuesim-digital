import * as z from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';

const transferStartPointSchema = z.strictObject({
    type: z.literal('transferStartPoint'),
    transferPointId: uuidSchema,
});

const alarmGroupStartPointSchema = z.strictObject({
    type: z.literal('alarmGroupStartPoint'),
    alarmGroupId: uuidSchema,
    duration: z.number().min(0),
});

export const startPointSchema = z.union([
    alarmGroupStartPointSchema,
    transferStartPointSchema,
]);

export type StartPoint = z.infer<typeof startPointSchema>;
export type TransferStartPoint = z.infer<typeof transferStartPointSchema>;
export type AlarmGroupStartPoint = z.infer<typeof alarmGroupStartPointSchema>;

export const newTransferStartPoint = (
    transferPointId: UUID
): TransferStartPoint => ({
    type: 'transferStartPoint',
    transferPointId,
});

export const newAlarmGroupStartPoint = (
    alarmGroupId: UUID,
    duration: number
): AlarmGroupStartPoint => {
    const startPoint = {
        type: 'alarmGroupStartPoint',
        alarmGroupId,
        duration,
    } satisfies AlarmGroupStartPoint;
    return alarmGroupStartPointSchema.parse(startPoint);
};
