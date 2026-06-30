import { z } from 'zod';
import type { Immutable } from 'immer';
import { getIdMapSchema, uuid, uuidSchema } from '../utils/uuid.js';
import { alarmGroupVehicleSchema } from './utils/alarm-group-vehicle.js';

export const alarmGroupSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('alarmGroup'),
    name: z.string(),
    alarmGroupVehicles: getIdMapSchema(alarmGroupVehicleSchema),
    triggerCount: z.number().nonnegative(),
    triggerLimit: z.number().nonnegative().nullable(),
});
export type AlarmGroup = Immutable<z.infer<typeof alarmGroupSchema>>;

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
