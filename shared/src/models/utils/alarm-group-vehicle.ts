import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';

export const alarmGroupVehicleSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('alarmGroupVehicle'),
    vehicleTemplateId: hybridIdSchema,
    /**
     * The time in ms until the vehicle arrives
     */
    time: z.number().nonnegative(),
    name: z.string(),
});
export type AlarmGroupVehicle = Immutable<
    z.infer<typeof alarmGroupVehicleSchema>
>;

export function newAlarmGroupVehicle(
    vehicleTemplateId: ElementVersionId | string,
    time: number,
    name: string,
    id?: string
) {
    return {
        id: id ?? uuid(),
        type: 'alarmGroupVehicle',
        vehicleTemplateId,
        time,
        name,
    } satisfies AlarmGroupVehicle;
}
