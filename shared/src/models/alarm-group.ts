import { z } from 'zod';
import { uuid } from '../utils/index.js';
import { alarmGroupVehicleSchema } from './utils/alarm-group-vehicle.js';

export const alarmGroupSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('alarmGroup'),
    name: z.string(),
    alarmGroupVehicles: z.record(z.uuidv4(), alarmGroupVehicleSchema),
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
