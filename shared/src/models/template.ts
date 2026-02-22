import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ExerciseState } from '../state.js';
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

export function getTemplates<T extends Template['type']>(
    draftState: ExerciseState,
    templateId: T
): {
    [key: string]: Extract<Template, { type: T }>;
} {
    return Object.fromEntries(
        Object.entries(draftState.templates).filter(
            ([_, template]) => template.type === templateId
        ) as [key: string, value: Extract<Template, { type: T }>][]
    );
}
