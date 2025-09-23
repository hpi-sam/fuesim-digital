import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { IsRadiogramStatus } from '../../utils/validators/is-radiogram-status.js';
import { getCreate } from '../utils/get-create.js';
import { VehicleResource } from '../utils/rescue-resource.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export class ResourceRequestRadiogram implements Radiogram {
    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsValue('resourceRequestRadiogram')
    readonly type = 'resourceRequestRadiogram';

    @IsUUID(4, uuidValidationOptions)
    readonly simulatedRegionId: UUID;

    /**
     * @deprecated use the helpers from {@link radiogram-helpers.ts}
     * or {@link radiogram-helpers-mutable.ts} instead
     */
    @IsRadiogramStatus()
    @ValidateNested()
    readonly status: ExerciseRadiogramStatus;

    @IsOptional()
    @IsBoolean()
    readonly resourcesPromised?: boolean;

    @IsBoolean()
    readonly informationAvailable: boolean = false;

    @IsString()
    @ValidateIf((_, value) => value !== null)
    public readonly informationRequestKey: string | null;

    @Type(() => VehicleResource)
    @ValidateNested()
    readonly requiredResource: VehicleResource = VehicleResource.create({});

    @Type(() => VehicleResource)
    @ValidateNested()
    @ValidateIf((_, value) => value !== null)
    readonly alreadyPromisedResource: VehicleResource | null = null;

    @IsBoolean()
    readonly canBeGranted: boolean = true;

    @IsString()
    readonly resourceRequestKey: string = '';

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
