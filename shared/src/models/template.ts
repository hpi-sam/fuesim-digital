import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import type { ExerciseState } from '../state.js';
import { vehicleTemplateSchema } from './vehicle-template.js';
import { personnelTemplateSchema } from './personnel-template.js';
import { materialTemplateSchema } from './material-template.js';
import { mapImageTemplateSchema } from './map-image-template.js';
import { alarmGroupSchema } from './alarm-group.js';
import { measureTemplateSchema } from './measure/measures.js';

export const templateSchema = z.union([
    vehicleTemplateSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
    alarmGroupSchema,
    measureTemplateSchema,
]);

export type Template = Immutable<z.infer<typeof templateSchema>>;

export const templateTypeSchema = z.union(
    templateSchema.options.map((option) => z.literal(option.shape.type.value))
);

export type TemplateType = z.infer<typeof templateTypeSchema>;

export function getTemplates<
    T extends Template['type'],
    State extends Pick<
        ExerciseState | WritableDraft<ExerciseState>,
        'templates'
    >,
>(
    draftState: State,
    templateType: T
): {
    [key: string]: Extract<State['templates'][string], { type: T }>;
} {
    return Object.fromEntries(
        Object.entries(draftState.templates).filter(
            ([_, template]) => template.type === templateType
        )
    ) as {
        [key: string]: Extract<State['templates'][string], { type: T }>;
    };
}
