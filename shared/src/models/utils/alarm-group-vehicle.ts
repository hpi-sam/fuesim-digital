import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuid } from '../../utils/index.js';

export const alarmGroupVehicleSchema = z.strictObject({
    id: z.uuidv4(),
    vehicleTemplateId: z.uuidv4(),
    /**
     * The time in ms until the vehicle arrives
     */
    time: z.number().nonnegative(),
    name: z.string(),
});
export type AlarmGroupVehicle = z.infer<typeof alarmGroupVehicleSchema>;

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
