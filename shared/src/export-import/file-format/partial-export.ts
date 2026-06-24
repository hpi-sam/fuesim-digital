import { z } from 'zod';
import type { Immutable } from 'immer';
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
import { exportImportFileSchema } from './export-import-file.js';

export const partialExportSchema = z.strictObject({
    ...exportImportFileSchema.shape,
    type: z.literal('partial'),
    patientCategories: z
        .array(
            z.object({
                patientTemplates: z.array(
                    z.object({ id: z.string().optional() })
                ),
            })
        )
        .optional(),
    vehicleTemplates: z
        .array(z.object({ id: z.string().optional() }))
        .optional(),
    mapImageTemplates: z
        .array(z.object({ id: z.string().optional() }))
        .optional(),
});
export type PartialExport = Immutable<z.infer<typeof partialExportSchema>>;

export const migratedPartialExportSchema = z.strictObject({
    type: z.literal('partial'),
    patientCategories: z.array(patientCategorySchema).optional(),
    vehicleTemplates: z.array(vehicleTemplateSchema).optional(),
    mapImageTemplates: z.array(mapImageTemplateSchema).optional(),
});
export type MigratedPartialExport = Immutable<
    z.infer<typeof migratedPartialExportSchema>
>;

export function newMigratedPartialExport(
    patientCategories?: readonly PatientCategory[],
    vehicleTemplates?: readonly VehicleTemplate[],
    mapImageTemplates?: readonly MapImageTemplate[]
): MigratedPartialExport {
    return {
        type: 'partial',
        patientCategories,
        vehicleTemplates,
        mapImageTemplates,
    };
}
