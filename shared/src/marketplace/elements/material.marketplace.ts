import { type MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceMaterial: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Material',
        plural: 'Materialien',
    },

    changeImpact: (draftState, change) => {
        throw new Error('Not implemented yet');
    },

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
};
