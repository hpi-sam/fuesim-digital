import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/index.js';
import type { ClientRole } from './client-role.js';
import { clientRoleSchema } from './client-role.js';

export const clientSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('client'),
    name: z.string().max(255),
    role: clientRoleSchema,
    viewRestrictedToViewportId: uuidSchema.optional(),
    isInWaitingRoom: z.boolean(),
});
export type Client = z.infer<typeof clientSchema>;

export function newClient(
    name: string,
    role: ClientRole,
    isInWaitingRoom: boolean = false
): Client {
    return {
        id: uuid(),
        type: 'client',
        name,
        role,
        viewRestrictedToViewportId: undefined,
        isInWaitingRoom,
    };
}
