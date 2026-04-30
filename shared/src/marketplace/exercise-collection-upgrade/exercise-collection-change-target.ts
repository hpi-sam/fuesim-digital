import { z } from 'zod';
import { uuidSchema, type UUID } from '../../utils/uuid.js';
import { type Element as FuesimElement } from '../../models/element.js';
import { collectionUpgradeChangeElementTypesSchema } from './exercise-collection-change-element.js';

export const changeAlarmgroupTargetSchema = z.object({
    kind: z.literal('alarm-group-vehicle'),
    alarmGroupId: uuidSchema,
    alarmGroupName: z.string(),
    alarmGrupVehicleId: uuidSchema,
});

export type ChangeAlarmgroupTarget = z.infer<
    typeof changeAlarmgroupTargetSchema
>;

export function newChangeAlarmgroupVehicleTarget(
    alarmGroupId: UUID,
    alarmGroupName: string,
    alarmGrupVehicleId: UUID
): ChangeAlarmgroupTarget {
    return {
        kind: 'alarm-group-vehicle',
        alarmGroupId,
        alarmGroupName,
        alarmGrupVehicleId,
    };
}

export const changeMapTargetSchema = z.object({
    kind: z.literal('map'),
    elementId: uuidSchema,
    elementType: collectionUpgradeChangeElementTypesSchema,
});

export type ChangeMapTarget = z.infer<typeof changeMapTargetSchema>;

export function newChangeMapTarget(
    type: FuesimElement['type'],
    elementId: UUID
): ChangeMapTarget {
    return {
        kind: 'map',
        elementType: type,
        elementId,
    };
}

export const changeTargetSchema = z.discriminatedUnion('kind', [
    changeAlarmgroupTargetSchema,
    changeMapTargetSchema,
]);

export type ChangeTarget = z.infer<typeof changeTargetSchema>;
