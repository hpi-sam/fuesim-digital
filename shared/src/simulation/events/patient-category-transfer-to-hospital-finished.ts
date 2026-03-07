import { IsBoolean } from 'class-validator';
import { IsValue } from '../../utils/validators/index.js';
import {
    type PatientStatus,
    patientStatusSchema,
    getCreate,
} from '../../models/index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { SimulationEvent } from './simulation-event.js';

export class PatientCategoryTransferToHospitalFinishedEvent
    implements SimulationEvent
{
    @IsValue('patientCategoryTransferToHospitalFinishedEvent')
    readonly type = 'patientCategoryTransferToHospitalFinishedEvent';

    @IsZodSchema(patientStatusSchema)
    readonly patientCategory: PatientStatus;

    /**
     * This is true, if this refers to its own one single region.
     * This is false, if it refers to all regions managed by one behavior.
     */
    @IsBoolean()
    readonly isRelatedOnlyToOwnRegion: boolean;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        patientCategory: PatientStatus,
        isRelatedOnlyToOwnRegion: boolean
    ) {
        this.patientCategory = patientCategory;
        this.isRelatedOnlyToOwnRegion = isRelatedOnlyToOwnRegion;
    }

    static readonly create = getCreate(this);
}
