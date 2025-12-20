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
    @IsUUID(4, { each: true })
    public readonly personnelTemplateIds: readonly UUID[];

    @IsArray()
    @IsUUID(4, { each: true })
    public readonly materialTemplateIds: readonly UUID[];

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        vehicleType: string,
        name: string,
        image: ImageProperties,
        patientCapacity: number,
        personnelTemplateIds: readonly UUID[],
        materialTemplateIds: readonly UUID[]
    ) {
        this.vehicleType = vehicleType;
        this.name = name;
        this.image = image;
        this.patientCapacity = patientCapacity;
        this.personnelTemplateIds = personnelTemplateIds;
        this.materialTemplateIds = materialTemplateIds;
    }

    static readonly create = getCreate(this);
}
