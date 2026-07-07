import { z } from 'zod';
import type { Immutable } from 'immer';
import type { UUID } from '../../utils/uuid.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';

export const alarmGroupVehicleSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('alarmGroupVehicle'),
    vehicleTemplateId: uuidSchema,
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
    vehicleTemplateId: UUID,
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
