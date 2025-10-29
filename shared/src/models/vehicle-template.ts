import { Type } from 'class-transformer';
import {
    IsUUID,
    IsString,
    ValidateNested,
    IsNumber,
    IsArray,
} from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuidValidationOptions, uuid } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { ImageProperties, getCreate } from './utils/index.js';

export class VehicleTemplate {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('vehicleTemplate' as const)
    public readonly type = 'vehicleTemplate';

    @IsString()
    public readonly vehicleType: string;

    @IsString()
    public readonly name: string;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image: ImageProperties;

    @IsNumber()
    public readonly patientCapacity: number;

    @IsArray()
    @IsString({ each: true })
    // TODO Suitable validation
    public readonly personnel: readonly string[];

    @IsArray()
    @IsString({ each: true })
    // TODO Suitable validation
    public readonly materials: readonly string[];

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        vehicleType: string,
        name: string,
        image: ImageProperties,
        patientCapacity: number,
        personnel: readonly string[],
        materials: readonly string[]
    ) {
        this.vehicleType = vehicleType;
        this.name = name;
        this.image = image;
        this.patientCapacity = patientCapacity;
        this.personnel = personnel;
        this.materials = materials;
    }

    static readonly create = getCreate(this);
}
