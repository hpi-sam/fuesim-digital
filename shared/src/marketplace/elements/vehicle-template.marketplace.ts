import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import {
    defineMarketplaceElement,
    type MarketplaceRegistryEntry,
} from '../marketplace-registry-element.js';

export const marketplaceVehicle: MarketplaceRegistryEntry<
    typeof vehicleTemplateSchema
> = defineMarketplaceElement({
    naming: {
        singular: 'Fahrzeug',
        plural: 'Fahrzeuge',
    },
    templateSchema: vehicleTemplateSchema,
    types: ['vehicle', 'vehicleTemplate'],

    changeApply: (state, changeApply) => {
        throw new Error('Not implemented yet');
    },

    changeImpact: (state, change) => {
        throw new Error('Not implemented yet');
    },
});
