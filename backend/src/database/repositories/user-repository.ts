import type { InferInsertModel } from 'drizzle-orm';
import { like, eq, or } from 'drizzle-orm';
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

    public async findUser(query: string) {
        return this.databaseConnection
            .select({
                username: userTable.username,
                displayName: userTable.displayName,
                id: userTable.id,
            })
            .from(userTable)
            .where(
                or(
                    like(userTable.username, `%${query}%`),
                    like(userTable.displayName, `%${query}%`)
                )
            );
    }

    public async deleteUserById(userId: string) {
        return this.databaseConnection
            .delete(userTable)
            .where(eq(userTable.id, userId));
    }

    public async getAllUsers() {
        return this.databaseConnection.select().from(userTable);
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
