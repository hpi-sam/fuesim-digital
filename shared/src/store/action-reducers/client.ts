import { z } from 'zod';
import type { Immutable } from 'immer';
import { clientSchema } from '../../models/client.js';
import type { ActionReducer } from '../action-reducer.js';
import { specificRoleSchema } from '../../models/utils/role.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { viewportSchema } from '../../models/viewport.js';
import { getElement } from './utils/get-element.js';

export const addClientActionSchema = z.strictObject({
    type: z.literal('[Client] Add client'),
    client: clientSchema,
});
export type AddClientAction = Immutable<z.infer<typeof addClientActionSchema>>;

export const removeClientActionSchema = z.strictObject({
    type: z.literal('[Client] Remove client'),
    clientId: clientSchema.shape.id,
});
export type RemoveClientAction = Immutable<
    z.infer<typeof removeClientActionSchema>
>;

export const restrictViewToViewportActionSchema = z.strictObject({
    type: z.literal('[Client] Restrict to viewport'),
    clientId: clientSchema.shape.id,
    viewportId: viewportSchema.shape.id.optional(),
});
export type RestrictViewToViewportAction = Immutable<
    z.infer<typeof restrictViewToViewportActionSchema>
>;

export const setWaitingRoomActionSchema = z.strictObject({
    type: z.literal('[Client] Set waitingroom'),
    clientId: clientSchema.shape.id,
    shouldBeInWaitingRoom: z.boolean(),
});
export type SetWaitingRoomAction = Immutable<
    z.infer<typeof setWaitingRoomActionSchema>
>;

export const changeSpecificClientRoleActionSchema = z.strictObject({
    type: z.literal('[Client] Change specific client role'),
    clientId: clientSchema.shape.id,
    newRole: specificRoleSchema,
});
export type ChangeSpecificClientRoleAction = Immutable<
    z.infer<typeof changeSpecificClientRoleActionSchema>
>;

export class SetClientInactiveAction implements Action {
    @IsValue('[Client] Set client inactive' as const)
    public readonly type = '[Client] Set client inactive';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
}

export class SetClientActiveAction implements Action {
    @IsValue('[Client] Set client active' as const)
    public readonly type = '[Client] Set client active';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
}

export namespace ClientActionReducers {
    export const addClient: ActionReducer<AddClientAction> = {
        type: '[Client] Add client',
        actionSchema: addClientActionSchema,
        reducer: (draftState, { client }) => {
            const clientMutable = cloneDeepMutable(client);
            clientMutable.name = clientMutable.name.trim();
            if (
                draftState.autojoinViewportId &&
                draftState.autojoinViewportId in draftState.viewports
            ) {
                clientMutable.viewRestrictedToViewportId =
                    draftState.autojoinViewportId;
                clientMutable.isInWaitingRoom = false;
            }
            draftState.clients[client.id] = clientMutable;
            if (
                clientMutable.name &&
                !draftState.collectedClientNames.includes(clientMutable.name)
            ) {
                draftState.collectedClientNames.push(clientMutable.name);
            }
            return draftState;
        },
        rights: 'server',
    };

    export const removeClient: ActionReducer<RemoveClientAction> = {
        type: '[Client] Remove client',
        actionSchema: removeClientActionSchema,
        reducer: (draftState, { clientId }) => {
            getElement(draftState, 'client', clientId);
            delete draftState.clients[clientId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const restrictViewToViewport: ActionReducer<RestrictViewToViewportAction> =
        {
            type: '[Client] Restrict to viewport',
            actionSchema: restrictViewToViewportActionSchema,
            reducer: (draftState, { clientId, viewportId }) => {
                const client = getElement(draftState, 'client', clientId);
                if (viewportId === undefined) {
                    client.viewRestrictedToViewportId = viewportId;
                    return draftState;
                }
                getElement(draftState, 'viewport', viewportId);
                client.viewRestrictedToViewportId = viewportId;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setWaitingRoom: ActionReducer<SetWaitingRoomAction> = {
        type: '[Client] Set waitingroom',
        actionSchema: setWaitingRoomActionSchema,
        reducer: (draftState, { clientId, shouldBeInWaitingRoom }) => {
            const client = getElement(draftState, 'client', clientId);
            client.isInWaitingRoom = shouldBeInWaitingRoom;
            return draftState;
        },
        rights: 'trainer',
    };

    export const changeSpecificClientRole: ActionReducer<ChangeSpecificClientRoleAction> =
        {
            type: '[Client] Change specific client role',
            actionSchema: changeSpecificClientRoleActionSchema,
            reducer: (draftState, { clientId, newRole }) => {
                const client = getElement(draftState, 'client', clientId);
                client.role.specificRole = newRole;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setClientInactive: ActionReducer<SetClientInactiveAction> = {
        action: SetClientInactiveAction,
        reducer: (draftState, { clientId }) => {
            const client = getElement(draftState, 'client', clientId);
            client.isActive = false;
            return draftState;
        },
        rights: 'server',
    };

    export const setClientActive: ActionReducer<SetClientActiveAction> = {
        action: SetClientActiveAction,
        reducer: (draftState, { clientId }) => {
            const client = getElement(draftState, 'client', clientId);
            client.isActive = true;
            return draftState;
        },
        rights: 'server',
    };
}
