import { alarmGroupSchema } from '../../models/alarm-group.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceAlarmgroup = defineMarketplaceElement({
    naming: {
        singular: 'Alarmgruppe',
        plural: 'Alarmgruppen',
    },
    templateSchema: alarmGroupSchema,
    types: ['alarmGroup'],

    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (currentState, change) => {
        throw new Error('Not implemented yet');
    },
});
