import { type MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceVehicleTemplate: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Fahrzeug',
        plural: 'Fahrzeuge',
    },
    changeApply: (state, changeApply) => {
        throw new Error('Not implemented yet');
    },

    changeImpact: (state, change) => {
        throw new Error('Not implemented yet');
    },
};
