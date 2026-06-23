import type { ExerciseState } from '../state.js';
import type { Template } from './template.js';

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
