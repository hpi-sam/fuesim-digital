import { defineMarketplaceElement } from '../marketplace-registry-element.js';
import { uploadedImageSchema } from '../../models/uploaded-image.js';

export const marketplaceUploadedImage = defineMarketplaceElement({
    naming: {
        singular: 'Bild',
        plural: 'Bilder',
    },
    templateSchema: uploadedImageSchema,
    types: ['uploadedImage'],

    // TODO
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
});
