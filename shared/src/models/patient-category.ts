import { z } from 'zod';
import { IsValue } from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import { PatientTemplate, patientTemplateSchema } from './patient-template.js';
import {
    type ImageProperties,
    patientStatusCodeSchema,
    getCreate,
    imagePropertiesSchema,
    type PatientStatusCode,
    newPatientStatusCode,
} from './utils/index.js';

export class PatientCategory {
    @IsValue('patientCategory' as const)
    public readonly type = 'patientCategory';

    @IsZodSchema(patientStatusCodeSchema)
    public readonly name: PatientStatusCode;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    @IsZodSchema(z.array(patientTemplateSchema).nonempty())
    public readonly patientTemplates: readonly PatientTemplate[] = [];

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        name: string,
        image: ImageProperties,
        patientTemplates: PatientTemplate[]
    ) {
        this.name = newPatientStatusCode(name);
        this.image = image;
        this.patientTemplates = patientTemplates;
    }

    static readonly create = getCreate(this);
}
