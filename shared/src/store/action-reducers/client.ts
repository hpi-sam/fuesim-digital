import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { type Client, clientSchema } from '../../models/client.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import {
    type SpecificRole,
    specificRoleSchema,
} from '../../models/utils/role.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { getElement } from './utils/index.js';

export class AddClientAction implements Action {
    @IsValue('[Client] Add client' as const)
    public readonly type = '[Client] Add client';

    @IsZodSchema(clientSchema)
    public readonly client!: Client;
}

export class RemoveClientAction implements Action {
    @IsValue('[Client] Remove client' as const)
    public readonly type = '[Client] Remove client';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
}

export class RestrictViewToViewportAction implements Action {
    @IsValue('[Client] Restrict to viewport' as const)
    public readonly type = '[Client] Restrict to viewport';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly viewportId?: UUID;
}

export class SetWaitingRoomAction implements Action {
    @IsValue('[Client] Set waitingroom' as const)
    public readonly type = '[Client] Set waitingroom';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
    @IsBoolean()
    public readonly shouldBeInWaitingRoom!: boolean;
}

export class ChangeSpecificClientRoleAction implements Action {
    @IsValue('[Client] Change specific client role' as const)
    public readonly type = '[Client] Change specific client role';
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
    @IsZodSchema(specificRoleSchema)
    public readonly newRole!: SpecificRole;
}

export namespace ClientActionReducers {
    export const addClient: ActionReducer<AddClientAction> = {
        action: AddClientAction,
        reducer: (draftState, { client }) => {
            const clientMutable = cloneDeepMutable(client);
            if (
                draftState.autojoinViewportId &&
                draftState.autojoinViewportId in draftState.viewports
            ) {
                clientMutable.viewRestrictedToViewportId =
                    draftState.autojoinViewportId;
                clientMutable.isInWaitingRoom = false;
            }
            draftState.clients[client.id] = clientMutable;
            return draftState;
        },
        rights: 'server',
    };

    export const removeClient: ActionReducer<RemoveClientAction> = {
        action: RemoveClientAction,
        reducer: (draftState, { clientId }) => {
            getElement(draftState, 'client', clientId);
            delete draftState.clients[clientId];
            return draftState;
        },
        rights: 'server',
    };

    export const restrictViewToViewport: ActionReducer<RestrictViewToViewportAction> =
        {
            action: RestrictViewToViewportAction,
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
        action: SetWaitingRoomAction,
        reducer: (draftState, { clientId, shouldBeInWaitingRoom }) => {
            const client = getElement(draftState, 'client', clientId);
            client.isInWaitingRoom = shouldBeInWaitingRoom;
            return draftState;
        },
        rights: 'trainer',
    };

    export const changeSpecificClientRole: ActionReducer<ChangeSpecificClientRoleAction> =
        {
            action: ChangeSpecificClientRoleAction,
            reducer: (draftState, { clientId, newRole }) => {
                const client = getElement(draftState, 'client', clientId);
                client.role.specificRole = newRole;
                return draftState;
            },
            rights: 'trainer',
        };
}
