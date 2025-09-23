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
import { getCreate } from '../utils/get-create.js';
import type { PatientStatus } from '../utils/patient-status.js';
import { patientStatusAllowedValues } from '../utils/patient-status.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';
import type { Scope as TransferProgressScope } from './utils/transfer-progress-scope.js';
import { scopeAllowedValues } from './utils/transfer-progress-scope.js';

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

    @IsLiteralUnion(patientStatusAllowedValues)
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
