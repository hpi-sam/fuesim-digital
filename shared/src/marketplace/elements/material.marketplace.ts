import { materialTemplateSchema } from '../../models/material-template.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceMaterial = defineMarketplaceElement({
    naming: {
        singular: 'Material',
        plural: 'Materialien',
    },
    templateSchema: materialTemplateSchema,
    types: ['material', 'materialTemplate'],

    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
});
