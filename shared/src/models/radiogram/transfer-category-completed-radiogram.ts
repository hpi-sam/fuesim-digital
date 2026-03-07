import {
    IsBoolean,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import { IsRadiogramStatus } from '../../utils/validators/is-radiogram-status.js';
import { getCreate } from '../utils/index.js';
import { type PatientStatus, patientStatusSchema } from '../utils/index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';
import type { Scope as TransferProgressScope } from './utils/transfer-progress-scope.js';
import { scopeAllowedValues } from './utils/index.js';

export class TransferCategoryCompletedRadiogram implements Radiogram {
    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsValue('transferCategoryCompletedRadiogram')
    readonly type = 'transferCategoryCompletedRadiogram';

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
    public readonly informationRequestKey: string | null = null;

    @IsZodSchema(patientStatusSchema)
    readonly completedCategory: PatientStatus = 'white';

    @IsLiteralUnion(scopeAllowedValues)
    readonly scope: TransferProgressScope = 'singleRegion';

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        id: UUID,
        simulatedRegionId: UUID,
        status: ExerciseRadiogramStatus
    ) {
        this.id = id;
        this.simulatedRegionId = simulatedRegionId;
        this.status = status;
    }

    static readonly create = getCreate(this);
}
