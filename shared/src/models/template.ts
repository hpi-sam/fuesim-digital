import { z } from 'zod';
import type { Immutable } from 'immer';
import { vehicleTemplateSchema } from './vehicle-template.js';
import { personnelTemplateSchema } from './personnel-template.js';
import { materialTemplateSchema } from './material-template.js';
import { mapImageTemplateSchema } from './map-image-template.js';
import { alarmGroupSchema } from './alarm-group.js';

export const templateSchema = z.union([
    vehicleTemplateSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
    alarmGroupSchema,
]);

export type Template = Immutable<z.infer<typeof templateSchema>>;

export const templateTypeSchema = z.union(
    templateSchema.options.map((option) => z.literal(option.shape.type.value))
);

export type TemplateType = z.infer<typeof templateTypeSchema>;
