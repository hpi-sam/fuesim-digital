import type { AccessKey } from 'fuesim-digital-shared';
import type { AccessKeyRepository } from '../repositories/access-key-repository.js';

export class AccessKeyService {
    public constructor(
        private readonly accessKeyRepository: AccessKeyRepository
    ) {}

    private createRandomInteger(maximum: number): number {
        return Math.floor(Math.random() * maximum);
    }

    /**
     * Generates and locks a new key
     * @param length The desired length of the output. Defaults to 6. Should be an integer. Must be at least 6.
     * @returns A random integer string (decimal) in [0, 10^{@link length})
     */
    public async generateKey(length: number) {
        return (await this.generateKeys(length))[0]!;
    }

    /**
     * Generates and locks a number of new keys
     * @param length The desired length of the output. Defaults to 6. Should be an integer. Must be at least 6.
     * @param count The number of keys to generate
     * @returns A random integer string (decimal) in [0, 10^{@link length})
     */
    public async generateKeys(length: number, count: number = 1) {
        if (length < 6) {
            throw new RangeError('length must be at least 6.');
        }

        const keyCount = await this.accessKeyRepository.getKeyCount();
        if (keyCount + count > 10_000) {
            // try to fail early
            throw new RangeError('Cannot generate more than 10000 keys.');
        }

        return this.accessKeyRepository.generateAndLock((existingKeys) => {
            if (existingKeys.size + count > 10_000) {
                throw new RangeError('Cannot generate more than 10000 keys.');
            }
            const newKeys: AccessKey[] = [];
            for (let i = 0; i < count; i++) {
                let newKey: AccessKey | undefined;
                do {
                    newKey = this.createRandomInteger(10 ** length)
                        .toString()
                        .padStart(length, '0') as AccessKey;
                    if (existingKeys.has(newKey)) {
                        newKey = undefined;
                    }
                } while (newKey === undefined);
                newKeys.push(newKey);
                existingKeys.add(newKey);
            }
            return newKeys;
        });
    }

    /**
     * Frees the allocation of a key
     * @param key The key to be removed from the list of locked keys
     */
    public async free(key: AccessKey) {
        await this.accessKeyRepository.free(key);
    }

    /**
     * Notes all provided {@link keys} as used.
     * @param keys to lock
     */
    public async lock(keys: AccessKey[]) {
        await this.accessKeyRepository.lock(keys);
    }
}
