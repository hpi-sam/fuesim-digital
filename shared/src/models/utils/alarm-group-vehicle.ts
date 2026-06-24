import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { hybridIdSchema, type HybridId } from '../../utils/hybrid-id.js';

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
    vehicleTemplateId: HybridId,
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
