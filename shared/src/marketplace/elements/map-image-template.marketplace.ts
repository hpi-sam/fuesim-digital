import type { MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceMapImage: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Kartenbild',
        plural: 'Kartenbilder',
    },
    // TODO:
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
};
