import {
    defineMarketplaceElement,
    type MarketplaceRegistryEntry,
} from '../marketplace-registry-element.js';
import { technicalChallengeTemplateSchema } from '../../models/technical-challenge/technical-challenge-template.js';

export const marketplaceTechnicalChallenge: MarketplaceRegistryEntry<
    typeof technicalChallengeTemplateSchema
> = defineMarketplaceElement({
    naming: {
        singular: 'Technische Herausforderung',
        plural: 'Technische Herausforderungen',
    },
    templateSchema: technicalChallengeTemplateSchema,
    types: ['technicalChallenge', 'technicalChallengeTemplate'],
    changeApply: (state, changeApply) => {
        throw new Error('Not implemented yet');
    },

    changeImpact: (state, change) => {
        throw new Error('Not implemented yet');
    },
});
