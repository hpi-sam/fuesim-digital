import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { MapImageTemplate, VehicleTemplate } from '../../models/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { PatientCategory } from '../../models/patient-category.js';
import { BaseExportImportFile } from './base-file.js';

export class PartialExport extends BaseExportImportFile {
    @IsValue('partial' as const)
    public readonly type: 'partial' = 'partial';

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PatientCategory)
    public readonly patientCategories?: PatientCategory[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VehicleTemplate)
    public readonly vehicleTemplates?: VehicleTemplate[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MapImageTemplate)
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
