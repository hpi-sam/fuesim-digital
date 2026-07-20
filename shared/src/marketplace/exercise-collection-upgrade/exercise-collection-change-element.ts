import { z } from 'zod';
import type { Immutable } from 'immer';
import { elementSchema } from '../../models/element.js';
import { alarmGroupVehicleSchema } from '../../models/utils/alarm-group-vehicle.js';

export const collectionUpgradeChangeElementSchema = z.discriminatedUnion(
    'type',
    [...elementSchema.options, alarmGroupVehicleSchema]
);

export const collectionUpgradeChangeElementTypesSchema = z.union(
    collectionUpgradeChangeElementSchema.options.map((option) =>
        z.literal(option.shape.type.value)
    )
);

export type CollectionUpgradeChangeElement = Immutable<
    z.infer<typeof collectionUpgradeChangeElementSchema>
>;
