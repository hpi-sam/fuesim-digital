import type { Migration } from './migration-functions.js';

interface RemoveMeasureTemplateCategoryAction {
    type: '[MeasureTemplateCategory] Remove MeasureTemplateCategory';
    name: string;
    moveTemplatesTo?: string;
}

export const measureTemplatesMarketplace66: Migration = {
    state: null,
    action: (intermediaryState, action) => {
        if (
            (action as { type: string }).type ===
            '[MeasureTemplateCategory] Remove MeasureTemplateCategory'
        ) {
            const typedAction = action as RemoveMeasureTemplateCategoryAction;
            // Previously, the templates of a removed category were always moved into the first remaining category.
            // Now they are deleted unless `moveTemplatesTo` is set.
            const remainingCategoryName = Object.keys(
                intermediaryState.measureTemplates
            ).find((name) => name !== typedAction.name);
            if (remainingCategoryName !== undefined) {
                typedAction.moveTemplatesTo = remainingCategoryName;
            }
        }
        return true;
    },
};
