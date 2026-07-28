import { type MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplacePersonnel: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Personal',
        plural: 'Personal',
    },

    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
};
