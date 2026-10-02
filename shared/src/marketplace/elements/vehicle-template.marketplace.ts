import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceVehicle = defineMarketplaceElement({
    naming: {
        singular: 'Fahrzeug',
        plural: 'Fahrzeuge',
    },
    templateSchema: vehicleTemplateSchema,
    types: ['vehicle', 'vehicleTemplate'],

    // TODO
    changeApply: (state, changeApply) => {
        throw new Error('Not implemented yet');
    },

    changeImpact: (state, change) => {
        throw new Error('Not implemented yet');
    },
});
