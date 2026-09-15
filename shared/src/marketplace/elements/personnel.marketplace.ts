import { personnelTemplateSchema } from '../../models/personnel-template.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplacePersonnel = defineMarketplaceElement({
    naming: {
        singular: 'Personal',
        plural: 'Personal',
    },
    templateSchema: personnelTemplateSchema,
    types: ['personnel', 'personnelTemplate'],

    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
});
