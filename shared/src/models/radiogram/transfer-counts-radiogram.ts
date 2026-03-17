import {
    IsBoolean,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import { IsRadiogramStatus } from '../../utils/validators/is-radiogram-status.js';
import { PatientStatus, patientStatusSchema } from '../utils/index.js';
import { getCreate } from '../utils/get-create.js';
import type { ResourceDescription } from '../utils/resource-description.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';
import type { Scope } from './utils/transfer-progress-scope.js';
import { scopeAllowedValues } from './utils/transfer-progress-scope.js';

export class TransferCountsRadiogram implements Radiogram {
    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsValue('transferCountsRadiogram')
    readonly type = 'transferCountsRadiogram';

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

    @IsZodSchema(z.record(patientStatusSchema, z.number()))
    readonly transferredPatientsCounts: ResourceDescription<PatientStatus> = {
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        black: 0,
        white: 0,
    };

    @IsZodSchema(z.record(patientStatusSchema, z.number()))
    readonly remainingPatientsCounts: ResourceDescription<PatientStatus> = {
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        black: 0,
        white: 0,
    };

    /**
     * Defines the scope of the counts reported with this radiogram.
     * * `singleRegion`: The patient counts refer only to the simulated region that sent the radiogram
     * * `transportManagement`: The patient counts refer to all simulated regions
     *   that are managed by the transport management behavior of the simulated region that sent the radiogram
     */
    @IsLiteralUnion(scopeAllowedValues)
    readonly scope: Scope = 'singleRegion';

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
    }

    static readonly create = getCreate(this);
}
