import { Type } from 'class-transformer';
import {
    IsUUID,
    IsString,
    ValidateNested,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import type { UUID, UUIDSet } from '../utils/index.js';
import { uuidValidationOptions, uuid } from '../utils/index.js';
import { IsUUIDSet, IsValue } from '../utils/validators/index.js';
import { IsPosition } from '../utils/validators/is-position.js';
import type { MaterialTemplate } from './material-template.js';
import type { Position } from './utils/position/position.js';
import { CanCaterFor } from './utils/cater-for.js';
import { ImageProperties } from './utils/image-properties.js';
import { getCreate } from './utils/get-create.js';

export class Material {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('material' as const)
    public readonly type = 'material';

    @IsUUID()
    public readonly baseTemplateId: UUID;

    @IsString()
    public readonly name: string;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId: UUID;

    @IsString()
    public readonly vehicleName: string;

    @IsUUIDSet()
    public readonly assignedPatientIds: UUIDSet;

    @ValidateNested()
    @Type(() => CanCaterFor)
    public readonly canCaterFor: CanCaterFor;

    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly overrideTreatmentRange: number;

    /**
     * Only patients in this range around the material's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly treatmentRange: number;

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    @ValidateNested()
    public readonly position: Position;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image: ImageProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        baseTemplateId: UUID,
        name: string,
        vehicleId: UUID,
        vehicleName: string,
        assignedPatientIds: UUIDSet,
        image: ImageProperties,
        canCaterFor: CanCaterFor,
        treatmentRange: number,
        overrideTreatmentRange: number,
        position: Position
    ) {
        this.baseTemplateId = baseTemplateId;
        this.name = name;
        this.vehicleId = vehicleId;
        this.vehicleName = vehicleName;
        this.assignedPatientIds = assignedPatientIds;
        this.image = image;
        this.canCaterFor = canCaterFor;
        this.treatmentRange = treatmentRange;
        this.overrideTreatmentRange = overrideTreatmentRange;
        this.position = position;
    }

    static readonly create = getCreate(this);

    static generateMaterial(
        materialTemplate: MaterialTemplate,
        vehicleId: UUID,
        vehicleName: string,
        position: Position
    ): Material {
        return this.create(
            materialTemplate.id,
            materialTemplate.name,
            vehicleId,
            vehicleName,
            {},
            materialTemplate.image,
            materialTemplate.canCaterFor,
            materialTemplate.treatmentRange,
            materialTemplate.overrideTreatmentRange,
            position
        );
    }
}
