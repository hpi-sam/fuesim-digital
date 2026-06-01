import { newClient, clientSchema } from './client.js';
import { newClientRole } from './client-role.js';

describe('Client model', () => {
    it('newClient sets isActive to true', () => {
        const client = newClient(
            'Alice',
            newClientRole('participant', 'mapOperator'),
            false
        );
        expect(client.isActive).toBe(true);
    });

    it('clientSchema accepts isActive field', () => {
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
            isActive: true,
        });
        expect(result.success).toBe(true);
    });
});
