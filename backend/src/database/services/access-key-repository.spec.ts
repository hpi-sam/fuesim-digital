import {
    isParallelExerciseKey,
    isParticipantKey,
    isTrainerKey,
} from 'fuesim-digital-shared';
import { createTestEnvironment } from '../../test/utils.js';

describe('access key service', () => {
    const environment = createTestEnvironment();

    it('creates participant keys', async () => {
        const participantKeys =
            await environment.repositories.accessKeyRepository.generateKeys(
                6,
                10_000
            );

        // should be in bounds
        participantKeys.forEach((id) => {
            const intKey = Number.parseInt(id);
            expect(intKey).toBeGreaterThanOrEqual(0);
            expect(intKey).toBeLessThan(1_000_000);
        });

        // should be unique
        const uniqueKeys = new Set(participantKeys);
        expect(uniqueKeys.size).toBe(participantKeys.length);

        // should be valid
        expect(participantKeys.every(isParticipantKey)).toBe(true);
    });

    describe('can create', () => {
        it('trainer keys', async () => {
            const key =
                await environment.repositories.accessKeyRepository.generateKey(
                    8
                );
            expect(isTrainerKey(key)).toBe(true);
        });
        it('parallel exercise keys', async () => {
            const key =
                await environment.repositories.accessKeyRepository.generateKey(
                    7
                );
            expect(isParallelExerciseKey(key)).toBe(true);
        });
    });
});
