import { IsBoolean, IsInt, IsString, IsUUID, MaxLength } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { getCreate } from './utils/index.js';

export class EocLogEntry {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('eocLogEntry' as const)
    public readonly type = 'eocLogEntry';

    /**
     * The time in the exercise
     */
    @IsInt()
    public readonly exerciseTimestamp: number;

    @IsString()
    @MaxLength(65535)
    public readonly message: string;

    @IsBoolean()
    public readonly isPrivate: boolean;

    // Directly save the name instead of a reference to keep the name after a disconnect
    @IsString()
    @MaxLength(255)
    public readonly clientName: string;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        exerciseTimestamp: number,
        message: string,
        clientName: string,
        isPrivate: boolean
    ) {
        this.exerciseTimestamp = exerciseTimestamp;
        this.message = message;
        this.clientName = clientName;
        this.isPrivate = isPrivate;
    }

    static readonly create = getCreate(this);
}
