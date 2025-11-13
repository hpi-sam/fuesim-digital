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
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import type { MaterialTemplate } from './material-template.js';
import {
    type Position,
    type ImageProperties,
    IsPosition,
} from './utils/index.js';
import {
    imagePropertiesSchema,
    getCreate,
    CanCaterFor,
} from './utils/index.js';

export class Material {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('material' as const)
    public readonly type = 'material';

    @IsUUID(4, uuidValidationOptions)
    public readonly templateId: UUID;

    @IsString()
    public readonly typeName: string;

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
    public readonly position: Position;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        templateId: UUID,
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
        this.templateId = templateId;
        this.typeName = name;
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
