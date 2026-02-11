import {
    IsBoolean,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { IsRadiogramStatus } from '../../utils/validators/is-radiogram-status.js';
import { getCreate } from '../utils/index.js';
import { type CanCaterFor, canCaterForSchema } from '../utils/cater-for.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';

export class MaterialCountRadiogram implements Radiogram {
    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsValue('materialCountRadiogram')
    readonly type = 'materialCountRadiogram';

    @IsUUID(4, uuidValidationOptions)
    readonly simulatedRegionId: UUID;

    /**
     * @deprecated use the helpers from {@link radiogram-helpers.ts}
     * or {@link radiogram-helpers-mutable.ts} instead
     */
    @IsRadiogramStatus()
    @ValidateNested()
    readonly status: ExerciseRadiogramStatus;

    @IsBoolean()
    readonly informationAvailable: boolean = false;

    @IsString()
    @ValidateIf((_, value) => value !== null)
    public readonly informationRequestKey: string | null;

    @IsZodSchema(canCaterForSchema)
    readonly materialForPatients: CanCaterFor;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        id: UUID,
        simulatedRegionId: UUID,
        key: string | null,
        status: ExerciseRadiogramStatus
    ) {
        this.id = id;
        this.simulatedRegionId = simulatedRegionId;
        this.informationRequestKey = key;
        this.status = status;
        this.materialForPatients = {
            red: 0,
            yellow: 0,
            green: 0,
            logicalOperator: 'and',
        };
    }

    static readonly create = getCreate(this);
}
