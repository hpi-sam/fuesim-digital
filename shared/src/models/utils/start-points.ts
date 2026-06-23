import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';

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

export type StartPoint = Immutable<z.infer<typeof startPointSchema>>;
export type TransferStartPoint = Immutable<
    z.infer<typeof transferStartPointSchema>
>;
export type AlarmGroupStartPoint = Immutable<
    z.infer<typeof alarmGroupStartPointSchema>
>;

export function newTransferStartPoint(
    transferPointId: UUID
): TransferStartPoint {
    return {
        type: 'transferStartPoint',
        transferPointId,
    };
}

export function newAlarmGroupStartPoint(
    alarmGroupId: UUID,
    duration: number
): AlarmGroupStartPoint {
    const startPoint = {
        type: 'alarmGroupStartPoint',
        alarmGroupId,
        duration,
    } satisfies AlarmGroupStartPoint;
    return alarmGroupStartPointSchema.parse(startPoint);
}
