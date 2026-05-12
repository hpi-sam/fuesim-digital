import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, type UUID, uuidSchema } from '../../utils/uuid.js';

export const alarmGroupVehicleSchema = z.strictObject({
    id: uuidSchema,
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
    name: string
) {
    return {
        id: uuid(),
        vehicleTemplateId,
        time,
        name,
    };
}
