import type { AccessKey } from 'fuesim-digital-shared';
import { createTestEnvironment } from '../../../test/utils.js';

describe('access key service', () => {
    const environment = createTestEnvironment();

    let generatedKeys = new Array<AccessKey>();
    beforeEach(async () => {
        await environment.accessKeyService.freeAll();
        generatedKeys = await environment.accessKeyService.generateKeys(
            6,
            10_000
        );
    });

    describe('valid keys', () => {
        it('should be in bounds', () => {
            generatedKeys.forEach((id) => {
                const intKey = Number.parseInt(id);
                expect(intKey).toBeGreaterThanOrEqual(0);
                expect(intKey).toBeLessThan(1_000_000);
            });
        });

        it('should not generate an already existing key', () => {
            const uniqueKeys = new Set(generatedKeys);
            expect(uniqueKeys.size).toBe(generatedKeys.length);
        });

        it('should return keys of a uniform size', () => {
            expect(generatedKeys.every((key) => key.length === 6)).toBe(true);
        });
    });

    describe('bounds', () => {
        it('should fail when no key is left', async () => {
            // We already have the maximum amount of keys in our collection
            await expect(async () =>
                environment.accessKeyService.generateKey()
            ).rejects.toThrow(RangeError);
        });

        it('should allow another key after freeing', async () => {
            await environment.accessKeyService.free(generatedKeys[0]!);
            await expect(async () =>
                environment.accessKeyService.generateKey()
            ).resolves.not.toThrow(RangeError);
        });
    });

    describe('different length', () => {
        beforeEach(async () => {
            await environment.accessKeyService.free(generatedKeys[0]!);
        });

        it('succeeds creating a key longer than 6', async () => {
            expect(
                (await environment.accessKeyService.generateKey(8)).length
            ).toBe(8);
            await environment.accessKeyService.free(generatedKeys[1]!);
            expect(
                (await environment.accessKeyService.generateKey(50)).length
            ).toBe(50);
        });

        it('fails creating a key shorter than 6', async () => {
            await expect(async () =>
                environment.accessKeyService.generateKey(5)
            ).rejects.toThrow(RangeError);
        });

        it('succeeds freeing a longer key', async () => {
            const key = await environment.accessKeyService.generateKey(8);

            // We now have the maximum amount of keys in our collection
            await expect(async () =>
                environment.accessKeyService.generateKey()
            ).rejects.toThrow(RangeError);

            await environment.accessKeyService.free(key);

            // After freeing there should be one available again.
            expect(async () => {
                await environment.accessKeyService.generateKey();
            }).not.toThrow(RangeError);
        });
    });
});
