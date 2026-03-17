import { IsLiteralUnion, IsValue } from '../utils/validators/index.js';
import type { Role } from './utils/index.js';
import { getCreate } from './utils/index.js';
import {
    roleAllowedValues,
    type SpecificRole,
    specificRoleAllowedValues,
} from './utils/role.js';

export class ClientRole {
    @IsValue('clientRole' as const)
    public readonly type = 'clientRole';

    @IsLiteralUnion(roleAllowedValues)
    public readonly mainRole: Role;

    @IsLiteralUnion(specificRoleAllowedValues)
    public readonly specificRole: SpecificRole;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(mainRole: Role, specificRole: SpecificRole) {
        this.mainRole = mainRole;
        this.specificRole = specificRole;
    }

    static readonly create = getCreate(this);

    public static getSpecificRoleDisplayName(
        specificRole: SpecificRole
    ): string {
        return (
            {
                eoc: 'Leitstelle',
                mapOperator: 'Kartenansicht',
                trainer: 'Trainer',
                operationsTablet: 'Einsatzübersicht',
            } satisfies { [key in SpecificRole]: string }
        )[specificRole];
    }
}
