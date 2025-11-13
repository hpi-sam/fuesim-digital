import * as z from 'zod';

const transferStartPointSchema = z.strictObject({
    type: z.literal('transferStartPoint'),
    transferPointId: z.uuidv4(),
});

const alarmGroupStartPointSchema = z.strictObject({
    type: z.literal('alarmGroupStartPoint'),
    alarmGroupId: z.uuidv4(),
    duration: z.number().min(0),
});

export const startPointSchema = z.union([
    alarmGroupStartPointSchema,
    transferStartPointSchema,
]);

export type StartPoint = z.infer<typeof startPointSchema>;
export type TransferStartPoint = z.infer<typeof transferStartPointSchema>;
export type AlarmGroupStartPoint = z.infer<typeof alarmGroupStartPointSchema>;
