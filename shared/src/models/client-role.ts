import { z } from 'zod';
import type { Immutable } from 'immer';
import type { Role, SpecificRole } from './utils/role.js';
import { roleSchema, specificRoleSchema } from './utils/role.js';

export const clientRoleSchema = z.strictObject({
    type: z.literal('clientRole'),
    mainRole: roleSchema,
    specificRole: specificRoleSchema,
});
export type ClientRole = Immutable<z.infer<typeof clientRoleSchema>>;

export function newClientRole(
    mainRole: Role,
    specificRole: SpecificRole
): ClientRole {
    return { type: 'clientRole', mainRole, specificRole };
}
