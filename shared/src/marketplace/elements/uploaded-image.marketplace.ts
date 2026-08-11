import type { MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceUploadedImage: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Bild',
        plural: 'Bilder',
    },
    // TODO:
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
};
