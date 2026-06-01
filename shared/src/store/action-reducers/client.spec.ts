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
        it('sets isActive to false and keeps client in state', () => {
            // Verify client is initially active
            expect(state.clients[clientId]).toBeDefined();
            expect(state.clients[clientId]!.isActive).toBe(true);

            // Apply the action
            state = reduceExerciseState(state, {
                type: '[Client] Set client inactive',
                clientId,
            });

            // Verify client still exists and isActive is now false
            expect(state.clients[clientId]).toBeDefined();
            expect(state.clients[clientId]!.isActive).toBe(false);
        });
    });

    describe('SetClientActiveAction', () => {
        it('sets isActive to true', () => {
            // First set the client as inactive
            state = reduceExerciseState(state, {
                type: '[Client] Set client inactive',
                clientId,
            });
            expect(state.clients[clientId]!.isActive).toBe(false);

            // Apply the action
            state = reduceExerciseState(state, {
                type: '[Client] Set client active',
                clientId,
            });

            // Verify client is now active
            expect(state.clients[clientId]!.isActive).toBe(true);
        });
    });
});
