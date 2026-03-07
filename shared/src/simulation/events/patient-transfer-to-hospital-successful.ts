import { IsUUID } from 'class-validator';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import {
    type PatientStatus,
    patientStatusSchema,
    getCreate,
} from '../../models/index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { SimulationEvent } from './simulation-event.js';

export class PatientTransferToHospitalSuccessfulEvent
    implements SimulationEvent
{
    @IsValue('patientTransferToHospitalSuccessfulEvent')
    readonly type = 'patientTransferToHospitalSuccessfulEvent';

    @IsZodSchema(patientStatusSchema)
    readonly patientCategory: PatientStatus;

    @IsUUID(4, uuidValidationOptions)
    readonly patientOriginSimulatedRegion: UUID;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        patientCategory: PatientStatus,
        patienrOriginSimulatedRegion: UUID
    ) {
        this.patientCategory = patientCategory;
        this.patientOriginSimulatedRegion = patienrOriginSimulatedRegion;
    }

    static readonly create = getCreate(this);
}
