import { IsLiteralUnion, IsValue } from '../utils/validators/index.js';
import type { Role } from './utils/index.js';
import { getCreate } from './utils/index.js';
import {
    roleAllowedValues,
    type SpecificRole,
    specificRolesAllowedValues,
} from './utils/role.js';

export class ClientRole {
    @IsValue('clientrole' as const)
    public readonly type = 'clientrole';

    @IsLiteralUnion(roleAllowedValues)
    public readonly mainRole: Role;

    @IsLiteralUnion(specificRolesAllowedValues)
    public readonly specificRole: SpecificRole | null;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(mainRole: Role, specificRole: SpecificRole | null) {
        this.mainRole = mainRole;
        this.specificRole = specificRole;
    }

    static readonly create = getCreate(this);
}
