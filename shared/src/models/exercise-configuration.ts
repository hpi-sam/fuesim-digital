import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';
import { IsValue } from '../utils/validators/index.js';
import { defaultTileMapProperties } from '../data/default-state/tile-map-properties.js';
import { getCreate, TileMapProperties } from './utils/index.js';

export class ExerciseConfiguration {
    @IsValue('exerciseConfiguration' as const)
    public readonly type = 'exerciseConfiguration';

    @IsBoolean()
    public readonly pretriageEnabled: boolean = true;
    @IsBoolean()
    public readonly bluePatientsEnabled: boolean = false;

    @IsString()
    public readonly patientIdentifierPrefix: string = '';

    @IsBoolean()
    public readonly vehicleStatusHighlight: boolean = false;
    @IsBoolean()
    public readonly vehicleStatusInPatientStatusColor: boolean = false;

    @ValidateNested()
    @Type(() => TileMapProperties)
    public readonly tileMapProperties: TileMapProperties =
        defaultTileMapProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    constructor() {}

    static readonly create = getCreate(this);
}
