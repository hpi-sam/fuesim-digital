import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { userTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class UserRepository extends BaseRepository {
    public async getUserById(id: string) {
        const user = await this.databaseConnection
            .select()
            .from(userTable)
            .where(eq(userTable.id, id))
            .limit(1);

        return this.onlySingle(user);
    }

    public async upsertUser(userData: InferInsertModel<typeof userTable>) {
        return this.databaseConnection
            .insert(userTable)
            .values(userData)
            .onConflictDoUpdate({
                target: userTable.id,
                set: userData,
            })
            .returning();
    }
}
