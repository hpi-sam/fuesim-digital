import { z } from 'zod';
import {
    getCreate,
    type PatientStatus,
    patientStatusSchema,
    type ResourceDescription,
} from '../../models/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { SimulationEvent } from './simulation-event.js';

export class PatientsCountedEvent implements SimulationEvent {
    @IsValue('patientsCountedEvent')
    readonly type = 'patientsCountedEvent';

    @IsZodSchema(z.record(patientStatusSchema, z.number()))
    readonly patientCount: ResourceDescription<PatientStatus>;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(patientCount: ResourceDescription<PatientStatus>) {
        this.patientCount = patientCount;
    }

    static readonly create = getCreate(this);
}
