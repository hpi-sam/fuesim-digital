import type { MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceMapImage: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Kartenbild',
        plural: 'Kartenbilder',
    },
    // TODO:
    changeApply: (draftState, change) => [],
    changeImpact: (draftState, change) => ({ impact: [], apply: [] }),
};
