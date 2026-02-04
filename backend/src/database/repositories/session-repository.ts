import crypto from 'node:crypto';
import { and, eq, gt, lte } from 'drizzle-orm';
import { sessionTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class SessionRepository extends BaseRepository {
    public async createSession(data: {
        userId: string;
        accessToken: string;
        validityDurationSeconds: number;
    }) {
        const sessionToken = crypto.randomBytes(32).toString('hex');

        await this.databaseConnection
            .insert(sessionTable)
            .values({
                id: sessionToken,
                userId: data.userId,
                accessToken: data.accessToken,
                expiresAt: new Date(
                    Date.now() + data.validityDurationSeconds * 1000
                ),
            })
            .returning();
        return sessionToken;
    }

    public async getValidSessionByToken(sessionId: string) {
        const session = await this.databaseConnection
            .select()
            .from(sessionTable)
            .where(
                and(
                    eq(sessionTable.id, sessionId),
                    gt(sessionTable.expiresAt, new Date())
                )
            )
            .limit(1);

        return this.onlySingle(session);
    }

    public async deleteSessionById(sessionId: string) {
        await this.databaseConnection
            .delete(sessionTable)
            .where(eq(sessionTable.id, sessionId));
    }

    public async deleteExpiredSessions() {
        await this.databaseConnection
            .delete(sessionTable)
            .where(lte(sessionTable.expiresAt, new Date()));
    }
}
