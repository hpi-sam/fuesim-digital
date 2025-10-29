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
import { IsPersonnelCount } from '../../utils/validators/is-personnel-count.js';
import { IsRadiogramStatus } from '../../utils/validators/is-radiogram-status.js';
import { getCreate } from '../utils/get-create.js';
import type { Radiogram } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export type PersonnelCount = { [key in string]: number };

export class PersonnelCountRadiogram implements Radiogram {
    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsValue('personnelCountRadiogram')
    readonly type = 'personnelCountRadiogram';

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

    @IsPersonnelCount()
    readonly personnelCount: PersonnelCount;

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
        this.personnelCount = {
            gf: 0,
            notarzt: 0,
            notSan: 0,
            rettSan: 0,
            san: 0,
        };
    }

    static readonly create = getCreate(this);
}
