import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { IsValue } from '../utils/validators/index.js';
import { CanCaterFor, getCreate, ImageProperties } from './utils/index.js';

export class MaterialTemplate {
    @IsValue('materialTemplate' as const)
    public readonly type = 'materialTemplate';

    @IsString()
    public readonly materialType: string;

    @IsString()
    public readonly name: string;

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
     * Only patients in this range around the material's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    @IsNumber()
    @Min(0)
    @Max(maxTreatmentRange)
    public readonly treatmentRange: number;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image: ImageProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        materialType: string,
        name: string,
        image: ImageProperties,
        canCaterFor: CanCaterFor,
        overrideTreatmentRange: number,
        treatmentRange: number
    ) {
        this.materialType = materialType;
        this.name = name;
        this.image = image;
        this.canCaterFor = canCaterFor;
        this.overrideTreatmentRange = overrideTreatmentRange;
        this.treatmentRange = treatmentRange;
    }

    static readonly create = getCreate(this);
}
