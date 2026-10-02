import { alarmGroupSchema } from '../../models/alarm-group.js';
import { defineMarketplaceElement } from '../marketplace-registry-element.js';

export const marketplaceAlarmGroup = defineMarketplaceElement({
    naming: {
        singular: 'Alarmgruppe',
        plural: 'Alarmgruppen',
    },
    templateSchema: alarmGroupSchema,
    types: ['alarmGroup'],

    // TODO
    changeApply: (draftState, change) => {
        throw new Error('Not implemented yet');
    },
    changeImpact: (currentState, change) => {
        throw new Error('Not implemented yet');
    },
});
