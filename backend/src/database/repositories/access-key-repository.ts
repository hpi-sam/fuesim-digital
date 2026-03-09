import { count, eq } from 'drizzle-orm';
import type { AccessKey } from 'fuesim-digital-shared';
import { accessKeyTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class AccessKeyRepository extends BaseRepository {
    /**
     * Get all allocated keys
     * @param tx optional database transaction
     */
    public async getAll() {
        const res = await this.databaseConnection.select().from(accessKeyTable);
        return new Set(res.map((x) => x.key));
    }

    /**
     * Checks whether a key is allocated
     * @param key to check
     */
    public async exists(key: AccessKey) {
        const res = await this.databaseConnection
            .select()
            .from(accessKeyTable)
            .where(eq(accessKeyTable.key, key));
        return res.length === 1;
    }

    /**
     * Get count of currently allocated keys
     */
    public async getKeyCount() {
        const res = await this.databaseConnection
            .select({ count: count() })
            .from(accessKeyTable);
        return this.onlySingle(res)?.count ?? 0;
    }

    /**
     * Free the allocation of a key
     * @param key to free
     */
    public async free(key: AccessKey) {
        await this.databaseConnection
            .delete(accessKeyTable)
            .where(eq(accessKeyTable.key, key));
    }

    /**
     * Frees the allocation of every currently allocated key
     */
    public async freeAll() {
        await this.databaseConnection.delete(accessKeyTable);
    }

    /**
     * Notes all provided {@link keys} as used.
     * @param keys to lock
     * @param tx optional database transaction
     */
    public async lock(keys: AccessKey[]) {
        if (keys.length === 0) {
            // Nothing to lock
            return;
        }
        return this.databaseConnection
            .insert(accessKeyTable)
            .values(keys.map((key) => ({ key })))
            .onConflictDoNothing()
            .returning();
    }

    public async generateAndLock(
        generator: (existingKeys: Set<AccessKey>) => AccessKey[]
    ) {
        let newKeys: AccessKey[];
        // Do this in a transaction to ensure that the list of existing keys is correct
        await this.transaction(async (tx) => {
            const existingKeys = await tx.getAll();
            newKeys = generator(existingKeys);
            await tx.lock(newKeys);
        });
        return newKeys!;
    }
}
