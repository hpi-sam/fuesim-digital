import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../../state.js';
import type {
    MeasureTemplate,
    MeasureTemplateCategory,
} from '../../../models/measure/measures.js';
import { ReducerError } from '../../reducer-error.js';
import type { UUID } from '../../../utils/uuid.js';

export function getCategory(
    state: WritableDraft<ExerciseState>,
    categoryName: string
): WritableDraft<MeasureTemplateCategory> {
    const category = state.measureTemplates[categoryName];
    if (!category) {
        throw new ReducerError(
            `MeasureTemplateCategory with name ${categoryName} does not exist`
        );
    }
    return category;
}

export function getCategoryForMeasureTemplateId(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MeasureTemplateCategory> {
    const containsTemplate = (c: MeasureTemplateCategory) => !!c.templates[id];
    const measureTemplateCategories = Object.values(state.measureTemplates);
    const category = measureTemplateCategories.find(containsTemplate);
    if (!category) {
        throw new ReducerError(`MeasureTemplate with id ${id} does not exist`);
    }
    return category;
}

export function getMeasureTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID,
    category?: WritableDraft<MeasureTemplateCategory>
): WritableDraft<MeasureTemplate> {
    // eslint-disable-next-line no-param-reassign
    category ??= getCategoryForMeasureTemplateId(state, id);
    const measureTemplate =
        state.measureTemplates[category.name]!.templates[id]!;
    return measureTemplate;
}
