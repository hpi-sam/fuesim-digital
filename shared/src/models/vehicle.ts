import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import type { UUID, UUIDSet } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsUUIDSet, IsValue } from '../utils/validators/index.js';
import { IsPosition } from '../utils/validators/is-position.js';
import { getCreate } from './utils/index.js';
import { ImageProperties } from './utils/image-properties.js';
import type { Position } from './utils/position/position.js';
import type { ExerciseOccupation } from './utils/occupations/exercise-occupation.js';
import { occupationTypeOptions } from './utils/occupations/exercise-occupation.js';

export class Vehicle {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('vehicle' as const)
    public readonly type = 'vehicle';

    @IsString()
    public readonly vehicleType: string;

    @IsString()
    public readonly name: string;

    @IsUUID(4, uuidValidationOptions)
    public readonly baseTemplateId: UUID;

    @IsUUIDSet()
    public readonly materialIds: UUIDSet = {};

    @IsNumber()
    public readonly patientCapacity: number;

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    @ValidateNested()
    public readonly position: Position;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image: ImageProperties;

    @IsUUIDSet()
    public readonly personnelIds: UUIDSet = {};

    @IsUUIDSet()
    public readonly patientIds: UUIDSet = {};

    @Type(...occupationTypeOptions)
    @ValidateNested()
    public readonly occupation: ExerciseOccupation;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        vehicleType: string,
        name: string,
        baseTemplateId: UUID,
        materialIds: UUIDSet,
        patientCapacity: number,
        image: ImageProperties,
        position: Position,
        occupation: ExerciseOccupation
    ) {
        this.vehicleType = vehicleType;
        this.name = name;
        this.baseTemplateId = baseTemplateId;
        this.materialIds = materialIds;
        this.patientCapacity = patientCapacity;
        this.image = image;
        this.position = position;
        this.occupation = occupation;
    }

    static readonly create = getCreate(this);
}
