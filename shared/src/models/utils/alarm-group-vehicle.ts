import { z } from 'zod';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import {
    elementVersionIdSchema,
    type ElementVersionId,
} from '../../marketplace/models/versioned-id-schema.js';

export const alarmGroupVehicleSchema = z.strictObject({
    id: uuidSchema,
    vehicleTemplateId: elementVersionIdSchema,
    /**
     * The time in ms until the vehicle arrives
     */
    time: z.number().nonnegative(),
    name: z.string(),
});
export type AlarmGroupVehicle = z.infer<typeof alarmGroupVehicleSchema>;

export function newAlarmGroupVehicle(
    vehicleTemplateId: ElementVersionId,
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
