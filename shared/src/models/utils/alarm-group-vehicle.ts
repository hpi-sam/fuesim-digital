import { z } from 'zod';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { type ElementVersionId } from '../../marketplace/models/versioned-id-schema.js';
import { hybridIdSchema } from '../../utils/hybrid-id.js';

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
export type AlarmGroupVehicle = z.infer<typeof alarmGroupVehicleSchema>;

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
