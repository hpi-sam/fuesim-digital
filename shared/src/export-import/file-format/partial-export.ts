import { z } from 'zod';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { IsValue } from '../../utils/validators/is-value.js';
import {
    type PatientCategory,
    patientCategorySchema,
} from '../../models/patient-category.js';
import {
    type VehicleTemplate,
    vehicleTemplateSchema,
} from '../../models/vehicle-template.js';
import {
    type MapImageTemplate,
    mapImageTemplateSchema,
} from '../../models/map-image-template.js';
import { BaseExportImportFile } from './base-file.js';

export class PartialExport extends BaseExportImportFile {
    @IsValue('partial' as const)
    public readonly type: 'partial' = 'partial';

    @IsZodSchema(z.array(patientCategorySchema).optional())
    public readonly patientCategories?: PatientCategory[];

    @IsZodSchema(z.array(vehicleTemplateSchema).optional())
    public readonly vehicleTemplates?: VehicleTemplate[];

    @IsZodSchema(z.array(mapImageTemplateSchema).optional())
    public readonly mapImageTemplates?: MapImageTemplate[];

    public constructor(
        patientCategories?: PatientCategory[],
        vehicleTemplates?: VehicleTemplate[],
        mapImageTemplates?: MapImageTemplate[]
    ) {
        super();
        this.patientCategories = patientCategories;
        this.vehicleTemplates = vehicleTemplates;
        this.mapImageTemplates = mapImageTemplates;
    }
}
