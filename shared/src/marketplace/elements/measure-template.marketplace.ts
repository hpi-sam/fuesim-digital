import { measureTemplateSchema } from '../../models/measure/measures.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceMeasureTemplate = defineMarketplaceElement({
    naming: {
        singular: 'Maßnahme',
        plural: 'Maßnahmen',
    },
    templateSchema: measureTemplateSchema,
    types: ['measure', 'measureTemplate'],

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (currentState, change) => {
        throw new Error('Not implemented yet');
    },
});
