import { newClient, clientSchema } from './client.js';
import { newClientRole } from './client-role.js';

describe('Client model', () => {
    it('newClient sets isInactive to false', () => {
        const client = newClient(
            'Alice',
            newClientRole('participant', 'mapOperator'),
            false
        );
        expect(client.isInactive).toBe(false);
    });

    it('clientSchema accepts isInactive field', () => {
        const result = clientSchema.safeParse({
            id: '00000000-0000-4000-a000-000000000001',
            type: 'client',
            name: 'Alice',
            role: {
                type: 'clientRole',
                mainRole: 'participant',
                specificRole: 'mapOperator',
            },
            isInWaitingRoom: false,
            isInactive: true,
        });
        expect(result.success).toBe(true);
    });
});
