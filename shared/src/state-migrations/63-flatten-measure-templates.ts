/**
 * Muss das bisherige Measures System migrierbar sein? Sonst können wir uns die hier sparen.
 */
import type { Migration } from './migration-functions.js';

interface TypedState<MeasureTemplate extends object> {
    templates?: {
        [key: string]: object;
    };
    measureTemplates?: {
        [categoryName: string]: {
            templates: {
                [key: string]: MeasureTemplate;
            };
        };
    };
}

export const flattenMeasureTemplates63: Migration = {
    unmigratableActions: true,
    action: null,

    state: (state) => {
        const typedState = state as TypedState<object>;
        typedState.templates ??= {};

        for (const [categoryName, category] of Object.entries(
            typedState.measureTemplates ?? {}
        )) {
            for (const [id, measureTemplate] of Object.entries(
                category.templates
            )) {
                typedState.templates[id] = {
                    ...measureTemplate,
                    category: categoryName,
                };
            }
        }

        delete typedState.measureTemplates;
    },
};
