import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import { type AlarmGroup, alarmGroupSchema } from '../../models/alarm-group.js';
import { alarmGroupVehicleSchema } from '../../models/utils/alarm-group-vehicle.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { type UUID } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';

export const addAlarmGroupActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Add AlarmGroup'),
    alarmGroup: alarmGroupSchema,
});
export type AddAlarmGroupAction = Immutable<
    z.infer<typeof addAlarmGroupActionSchema>
>;

export const renameAlarmGroupActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Rename AlarmGroup'),
    alarmGroupId: alarmGroupSchema.shape.id,
    name: alarmGroupSchema.shape.name,
});

export type RenameAlarmGroupAction = Immutable<
    z.infer<typeof renameAlarmGroupActionSchema>
>;

export const limitAlarmGroupActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Limit AlarmGroup'),
    alarmGroupId: alarmGroupSchema.shape.id,
    triggerLimit: alarmGroupSchema.shape.triggerLimit,
});

export type LimitAlarmGroupAction = Immutable<
    z.infer<typeof limitAlarmGroupActionSchema>
>;

export const removeAlarmGroupActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Remove AlarmGroup'),
    alarmGroupId: alarmGroupSchema.shape.id,
});
export type RemoveAlarmGroupAction = Immutable<
    z.infer<typeof removeAlarmGroupActionSchema>
>;

export const addAlarmGroupVehicleActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Add AlarmGroupVehicle'),
    alarmGroupId: alarmGroupSchema.shape.id,
    alarmGroupVehicle: alarmGroupVehicleSchema,
});

export type AddAlarmGroupVehicleAction = Immutable<
    z.infer<typeof addAlarmGroupVehicleActionSchema>
>;

export const editAlarmGroupVehicleActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Edit AlarmGroupVehicle'),
    alarmGroupId: alarmGroupSchema.shape.id,
    alarmGroupVehicleId: alarmGroupVehicleSchema.shape.id,
    time: alarmGroupVehicleSchema.shape.time,
    name: alarmGroupSchema.shape.name,
});
export type EditAlarmGroupVehicleAction = Immutable<
    z.infer<typeof editAlarmGroupVehicleActionSchema>
>;

export const removeAlarmGroupVehicleActionSchema = z.strictObject({
    type: z.literal('[AlarmGroup] Remove AlarmGroupVehicle'),
    alarmGroupId: alarmGroupSchema.shape.id,
    alarmGroupVehicleId: alarmGroupVehicleSchema.shape.id,
});
export type RemoveAlarmGroupVehicleAction = Immutable<
    z.infer<typeof removeAlarmGroupVehicleActionSchema>
>;

export namespace AlarmGroupActionReducers {
    export const addAlarmGroup: ActionReducer<AddAlarmGroupAction> = {
        type: addAlarmGroupActionSchema.shape.type.value,
        actionSchema: addAlarmGroupActionSchema,
        reducer: (draftState, { alarmGroup }) => {
            draftState.alarmGroups[alarmGroup.id] =
                cloneDeepMutable(alarmGroup);
            return draftState;
        },
        rights: 'trainer',
    };

    export const renameAlarmGroup: ActionReducer<RenameAlarmGroupAction> = {
        type: renameAlarmGroupActionSchema.shape.type.value,
        actionSchema: renameAlarmGroupActionSchema,
        reducer: (draftState, { alarmGroupId, name }) => {
            const alarmGroup = getElement(
                draftState,
                'alarmGroup',
                alarmGroupId
            );
            alarmGroup.name = name;
            return draftState;
        },
        rights: 'trainer',
    };

    export const limitAlarmGroup: ActionReducer<LimitAlarmGroupAction> = {
        type: limitAlarmGroupActionSchema.shape.type.value,
        actionSchema: limitAlarmGroupActionSchema,
        reducer: (draftState, { alarmGroupId, triggerLimit }) => {
            const alarmGroup = getElement(
                draftState,
                'alarmGroup',
                alarmGroupId
            );
            alarmGroup.triggerLimit = triggerLimit ?? null;
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeAlarmGroup: ActionReducer<RemoveAlarmGroupAction> = {
        type: removeAlarmGroupActionSchema.shape.type.value,
        actionSchema: removeAlarmGroupActionSchema,
        reducer: (draftState, { alarmGroupId }) => {
            getElement(draftState, 'alarmGroup', alarmGroupId);
            delete draftState.alarmGroups[alarmGroupId];
            // Remove this alarm group from every measure template's alarm properties
            for (const category of Object.values(draftState.measureTemplates)) {
                for (const template of Object.values(category.templates)) {
                    for (const property of template.properties) {
                        if (property.type === 'alarm') {
                            property.alarmGroups = property.alarmGroups.filter(
                                (id) => id !== alarmGroupId
                            );
                        }
                    }
                }
            }
            return draftState;
        },
        rights: 'trainer',
    };

    export const addAlarmGroupVehicle: ActionReducer<AddAlarmGroupVehicleAction> =
        {
            type: addAlarmGroupVehicleActionSchema.shape.type.value,
            actionSchema: addAlarmGroupVehicleActionSchema,
            reducer: (draftState, { alarmGroupId, alarmGroupVehicle }) => {
                const alarmGroup = getElement(
                    draftState,
                    'alarmGroup',
                    alarmGroupId
                );
                alarmGroup.alarmGroupVehicles[alarmGroupVehicle.id] =
                    cloneDeepMutable(alarmGroupVehicle);
                return draftState;
            },
            rights: 'trainer',
        };

    export const editAlarmGroupVehicle: ActionReducer<EditAlarmGroupVehicleAction> =
        {
            type: editAlarmGroupVehicleActionSchema.shape.type.value,
            actionSchema: editAlarmGroupVehicleActionSchema,
            reducer: (
                draftState,
                { alarmGroupId, alarmGroupVehicleId, time, name }
            ) => {
                const alarmGroup = getElement(
                    draftState,
                    'alarmGroup',
                    alarmGroupId
                );
                const alarmGroupVehicle = getAlarmGroupVehicle(
                    alarmGroup,
                    alarmGroupVehicleId
                );
                alarmGroupVehicle.time = time;
                alarmGroupVehicle.name = name;
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeAlarmGroupVehicle: ActionReducer<RemoveAlarmGroupVehicleAction> =
        {
            type: removeAlarmGroupVehicleActionSchema.shape.type.value,
            actionSchema: removeAlarmGroupVehicleActionSchema,
            reducer: (draftState, { alarmGroupId, alarmGroupVehicleId }) => {
                const alarmGroup = getElement(
                    draftState,
                    'alarmGroup',
                    alarmGroupId
                );
                getAlarmGroupVehicle(alarmGroup, alarmGroupVehicleId);
                delete alarmGroup.alarmGroupVehicles[alarmGroupVehicleId];
                return draftState;
            },
            rights: 'trainer',
        };
}

function getAlarmGroupVehicle(
    alarmGroup: WritableDraft<AlarmGroup>,
    alarmGroupVehicleId: UUID
) {
    const alarmGroupVehicle =
        alarmGroup.alarmGroupVehicles[alarmGroupVehicleId];
    if (!alarmGroupVehicle) {
        throw new ReducerError(
            `AlarmGroupVehicle with id ${alarmGroupVehicleId} does not exist in AlarmGroup with id ${alarmGroup.id}`
        );
    }
    return alarmGroupVehicle;
}
