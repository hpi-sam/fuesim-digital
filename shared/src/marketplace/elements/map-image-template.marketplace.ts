import { mapImageTemplateSchema } from '../../models/map-image-template.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceMapImage = defineMarketplaceElement({
    naming: {
        singular: 'Kartenbild',
        plural: 'Kartenbilder',
    },
    templateSchema: mapImageTemplateSchema,
    types: ['mapImage', 'mapImageTemplate'],

    // TODO:
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
});
