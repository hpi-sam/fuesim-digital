import { z } from 'zod';
import { materialTemplateSchema } from '../material-template.js';
import type { ExerciseState } from '../../state.js';
import { alarmGroupSchema } from '../alarm-group.js';
import { mapImageTemplateSchema } from '../map-image-template.js';
import { personnelTemplateSchema } from '../personnel-template.js';
import { vehicleTemplateSchema } from '../vehicle-template.js';

export const templateSchema = z.union([
    vehicleTemplateSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
    alarmGroupSchema,
]);

export type Template = z.infer<typeof templateSchema>;

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
