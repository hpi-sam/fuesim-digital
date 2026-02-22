import { z } from 'zod';
import { uuid, type UUID, uuidSchema } from '../../utils/uuid.js';
import { Marketplace } from '../../http-interfaces.js';
import {
    ElementVersionId,
    elementVersionIdSchema,
} from '../versioned-elements.js';

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
