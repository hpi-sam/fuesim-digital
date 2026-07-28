import { type MarketplaceRegistryEntry } from './marketplace-elements.js';

export const marketplaceAlarmGroup: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Alarmgruppe',
        plural: 'Alarmgruppen',
    },
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (currentState, change) => {
        throw new Error('Not implemented yet');
    },
};
