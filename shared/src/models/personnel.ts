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
import type { PersonnelTemplate } from './personnel-template.js';
import { CanCaterFor, ImageProperties, getCreate } from './utils/index.js';
import type { Position } from './utils/position/position.js';

export class Personnel {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('personnel' as const)
    public readonly type = 'personnel';

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId: UUID;

    @IsString()
    public readonly personnelType: string;

    @IsString()
    public readonly name: string;

    @IsString()
    public readonly abbreviation: string = '';

    @IsString()
    public readonly vehicleName: string;

    @IsUUIDSet()
    public readonly assignedPatientIds: UUIDSet;

    @ValidateNested()
    @Type(() => CanCaterFor)
    public readonly canCaterFor: CanCaterFor;

    /**
     * Patients in this range are preferred over patients that are more far away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly overrideTreatmentRange: number;

    /**
     * Only patients in this range around the personnel's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly treatmentRange: number;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image: ImageProperties;

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    @ValidateNested()
    public readonly position: Position;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        vehicleId: UUID,
        vehicleName: string,
        personnelType: string,
        name: string,
        assignedPatientIds: UUIDSet,
        image: ImageProperties,
        canCaterFor: CanCaterFor,
        treatmentRange: number,
        overrideTreatmentRange: number,
        position: Position,
        abbreviation: string = ''
    ) {
        this.vehicleId = vehicleId;
        this.vehicleName = vehicleName;
        this.personnelType = personnelType;
        this.name = name;
        this.assignedPatientIds = assignedPatientIds;
        this.image = image;
        this.canCaterFor = canCaterFor;
        this.treatmentRange = treatmentRange;
        this.overrideTreatmentRange = overrideTreatmentRange;
        this.position = position;
        this.abbreviation = abbreviation;
    }

    static readonly create = getCreate(this);

    static generatePersonnel(
        personnelTemplate: PersonnelTemplate,
        vehicleId: UUID,
        vehicleName: string,
        position: Position
    ): Personnel {
        return this.create(
            vehicleId,
            vehicleName,
            personnelTemplate.personnelType,
            personnelTemplate.name,
            {},
            personnelTemplate.image,
            personnelTemplate.canCaterFor,
            personnelTemplate.treatmentRange,
            personnelTemplate.overrideTreatmentRange,
            position,
            personnelTemplate.abbreviation
        );
    }
}
