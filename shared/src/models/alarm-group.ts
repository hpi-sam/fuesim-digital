import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { alarmGroupVehicleSchema } from './utils/alarm-group-vehicle.js';
import { versionedElementModel } from './versioned-element-model.js';

export const alarmGroupSchema = z.strictObject({
    ...versionedElementModel.partial().shape,
    id: uuidSchema,
    type: z.literal('alarmGroup'),
    name: z.string(),
    alarmGroupVehicles: z.record(uuidSchema, alarmGroupVehicleSchema),
    triggerCount: z.number().nonnegative(),
    triggerLimit: z.number().nonnegative().nullable(),
});
export type AlarmGroup = z.infer<typeof alarmGroupSchema>;

export function newAlarmGroup(name: string): AlarmGroup {
    return {
        id: uuid(),
        type: 'alarmGroup',
        name,
        alarmGroupVehicles: {},
        triggerCount: 0,
        triggerLimit: null,
    };
}
