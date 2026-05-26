import { ExerciseState } from '../../state.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import { type UUID } from '../../utils/uuid.js';
import { reduceExerciseState } from '../reduce-exercise-state.js';
import { newClient } from '../../models/client.js';
import { newClientRole } from '../../models/client-role.js';

describe('ClientActionReducers', () => {
    let state: ExerciseState;
    let clientId: UUID;

    beforeEach(() => {
        state = ExerciseState.create('123456' as ParticipantKey);
        // Add a client to the state
        const client = newClient(
            'Test Client',
            newClientRole('participant', 'mapOperator')
        );
        clientId = client.id;
        state = reduceExerciseState(state, {
            type: '[Client] Add client',
            client,
        });
    });

    describe('SetClientInactiveAction', () => {
        it('sets isInactive to true and keeps client in state', () => {
            // Verify client is initially active
            expect(state.clients[clientId]).toBeDefined();
            expect(state.clients[clientId]!.isInactive).toBe(false);

            // Apply the action
            state = reduceExerciseState(state, {
                type: '[Client] Set client inactive',
                clientId,
            });

            // Verify client still exists and isInactive is now true
            expect(state.clients[clientId]).toBeDefined();
            expect(state.clients[clientId]!.isInactive).toBe(true);
        });
    });

    describe('ReactivateClientAction', () => {
        it('sets isInactive to false', () => {
            // First set the client as inactive
            state = reduceExerciseState(state, {
                type: '[Client] Set client inactive',
                clientId,
            });
            expect(state.clients[clientId]!.isInactive).toBe(true);

            // Apply the reactivate action
            state = reduceExerciseState(state, {
                type: '[Client] Reactivate client',
                clientId,
            });

            // Verify client is now active
            expect(state.clients[clientId]!.isInactive).toBe(false);
        });
    });
});
