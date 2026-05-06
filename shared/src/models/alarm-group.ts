import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import { isElementVersionId } from '../marketplace/models/versioned-id-schema.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import { alarmGroupVehicleSchema } from './utils/alarm-group-vehicle.js';
import { registerDependency } from './utils/dependency-registry.js';

export const alarmGroupSchema = z.strictObject({
    ...versionedElementModelSchema.partial().shape,
    id: uuidSchema,
    type: z.literal('alarmGroup'),
    name: z.string(),
    alarmGroupVehicles: z.record(uuidSchema, alarmGroupVehicleSchema),
    triggerCount: z.number().nonnegative(),
    triggerLimit: z.number().nonnegative().nullable(),
});
export type AlarmGroup = Immutable<z.infer<typeof alarmGroupSchema>>;

registerDependency('alarmGroup', {
    detect: (content) =>
        Object.values(content.alarmGroupVehicles)
            .map((vehicle) => vehicle.vehicleTemplateId)
            .filter((id) => isElementVersionId(id)),
    replace: (content, replacements) => {
        const mutableContent = cloneDeepMutable(content);
        mutableContent.alarmGroupVehicles = Object.fromEntries(
            Object.entries(content.alarmGroupVehicles)
                .filter((f) => {
                    const replacement = replacements.find(
                        (r) => r.old === f[1].vehicleTemplateId
                    );
                    return replacement?.new !== null;
                })
                .map(([key, vehicle]) => {
                    const mutableVehicle = cloneDeepMutable(vehicle);
                    const replacement = replacements.find(
                        (r) => r.old === vehicle.vehicleTemplateId
                    );
                    if (replacement && replacement.new !== null) {
                        mutableVehicle.vehicleTemplateId = replacement.new;
                    }
                    return [key, vehicle];
                })
        );
        return content;
    },
});

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
