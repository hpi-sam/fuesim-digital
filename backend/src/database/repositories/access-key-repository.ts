import type {
    ParallelExerciseKey,
    ParticipantKey,
    TrainerKey,
} from 'fuesim-digital-shared';
import { exerciseTable, parallelExerciseTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

type Key = ParallelExerciseKey | ParticipantKey | TrainerKey;
type KeyLength<K extends Key> = K extends TrainerKey
    ? 8
    : K extends ParallelExerciseKey
      ? 7
      : K extends ParticipantKey
        ? 6
        : never;
export class AccessKeyRepository extends BaseRepository {
    public async getTrainerKeys(): Promise<{ key: TrainerKey }[]> {
        return this.databaseConnection
            .select({ key: exerciseTable.trainerKey })
            .from(exerciseTable);
    }

    public async getParticipantKeys(): Promise<{ key: ParticipantKey }[]> {
        return this.databaseConnection
            .select({ key: exerciseTable.participantKey })
            .from(exerciseTable);
    }

    public async getParallelExerciseKeys(): Promise<
        { key: ParallelExerciseKey }[]
    > {
        return this.databaseConnection
            .select({ key: parallelExerciseTable.participantKey })
            .from(parallelExerciseTable);
    }
    /**
     * Generates a new key
     * @param length The desired length of the output. Defaults to 6. Should be an integer. Must be at least 6.
     * @returns A random integer string (decimal) in [0, 10^{@link length})
     */
    public async generateKey<K extends Key>(length: KeyLength<K>): Promise<K> {
        return (await this.generateKeys<K, KeyLength<K>>(length, 1))[0]!;
    }

    /**
     * Generates a number of new keys
     * @param length The desired length of the output. Defaults to 6. Should be an integer. Must be at least 6.
     * @param count The number of keys to generate
     * @returns A random integer string (decimal) in [0, 10^{@link length})
     */
    public async generateKeys<K extends Key, KL extends KeyLength<K>>(
        length: KL,
        count: number = 1
    ): Promise<K[]> {
        let keys: { key: K }[];
        if (length === 6) {
            keys = (await this.getParticipantKeys()) as {
                key: K;
            }[];
        } else if (length === 7) {
            keys = (await this.getParallelExerciseKeys()) as {
                key: K;
            }[];
        } else {
            keys = (await this.getTrainerKeys()) as { key: K }[];
        }

        const existingKeySet = new Set(keys.map((o) => o.key));

        return this.keyGenerator(length, count, existingKeySet);
    }

    private keyGenerator<K extends Key>(
        length: KeyLength<K>,
        count: number,
        existingKeys: Set<K>
    ): K[] {
        const newKeys: K[] = [];
        for (let i = 0; i < count; i++) {
            let newKey: K | undefined;
            do {
                newKey = this.createRandomInteger(10 ** length)
                    .toString()
                    .padStart(length, '0') as K;
                if (existingKeys.has(newKey)) {
                    newKey = undefined;
                }
            } while (newKey === undefined);
            newKeys.push(newKey);
            existingKeys.add(newKey);
        }
        return newKeys;
    }

    private createRandomInteger(maximum: number): number {
        return Math.floor(Math.random() * maximum);
    }
}
