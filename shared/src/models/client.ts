import {
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { getCreate } from './utils/index.js';
import { ClientRole } from './client-role.js';

export class Client {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('client' as const)
    public readonly type = 'client';

    @IsString()
    // Required by database
    @MaxLength(255)
    public readonly name: string;

    @ValidateNested()
    @Type(() => ClientRole)
    public readonly role: ClientRole;

    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly viewRestrictedToViewportId?: UUID;

    @IsBoolean()
    public readonly isInWaitingRoom: boolean;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        name: string,
        role: ClientRole,
        isInWaitingRoom?: boolean,
        viewRestrictedToViewportId?: UUID
    ) {
        this.name = name;
        this.role = role;
        this.viewRestrictedToViewportId = viewRestrictedToViewportId;
        this.isInWaitingRoom = isInWaitingRoom ?? true;
    }

    static readonly create = getCreate(this);
}
