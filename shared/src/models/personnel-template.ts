import { Type } from 'class-transformer';
import {
    IsNumber,
    IsString,
    IsUUID,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { IsValue } from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import type { UUID } from '../utils/index.js';
import { uuidValidationOptions, uuid } from '../utils/index.js';
import {
    CanCaterFor,
    getCreate,
    imagePropertiesSchema,
    type ImageProperties,
} from './utils/index.js';

export class PersonnelTemplate {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('personnelTemplate' as const)
    public readonly type = 'personnelTemplate';

    @IsString()
    public readonly personnelType: string;

    @IsString()
    public readonly name: string;

    @IsString()
    public readonly abbreviation: string = '';

    @ValidateNested()
    @Type(() => CanCaterFor)
    public readonly canCaterFor: CanCaterFor;

    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly overrideTreatmentRange: number;

    /**
     * Only patients in this range around the personnel's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly treatmentRange: number;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        personnelType: string,
        name: string,
        image: ImageProperties,
        canCaterFor: CanCaterFor,
        overrideTreatmentRange: number,
        treatmentRange: number,
        abbreviation: string = ''
    ) {
        this.personnelType = personnelType;
        this.name = name;
        this.image = image;
        this.canCaterFor = canCaterFor;
        this.overrideTreatmentRange = overrideTreatmentRange;
        this.treatmentRange = treatmentRange;
        this.abbreviation = abbreviation;
    }

    static readonly create = getCreate(this);
}
