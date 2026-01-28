import type { UserRepository } from '../database/repositories/user-repository.js';
import type { SessionRepository } from '../database/repositories/session-repository.js';
import type { SessionEntry } from '../database/schema.js';
import { PeriodicEventHandler } from '../exercise/periodic-events/periodic-event-handler.js';
import { OidcService } from './oidc-service.js';

export class AuthService {
    public readonly oidcService;
    public readonly SESSION_DURATION_S = 7 * 24 * 60 * 60; // 7 days
    public readonly SESSION_COOKIE_NAME = 'fuesim_session';

    public readonly SESSION_CLEAR_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    public readonly sessionClearHandler: PeriodicEventHandler;

    public constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository
    ) {
        this.oidcService = new OidcService(this);

        this.sessionClearHandler = new PeriodicEventHandler(
            this.clearExpiredSessions.bind(this),
            this.SESSION_CLEAR_INTERVAL_MS
        );
    }

    public async initialize(opts?: { skipOidcDiscovery?: boolean }) {
        await this.oidcService.initialize({
            skipOidcDiscovery: opts?.skipOidcDiscovery,
        });
        return this;
    }

    public async createNewSession(data: {
        user: OidcService.UserInfo;
        accessToken: string;
    }): Promise<string> {
        return this.userRepository.transaction(async (userRepoTrans) => {
            await userRepoTrans.upsertUser({
                id: data.user.id,
                displayName: data.user.displayName,
                username: data.user.username,
            });

            const sessionRepoTrans =
                this.sessionRepository.withConnection(userRepoTrans);
            const sessionToken = await sessionRepoTrans.createSession({
                validityDurationSeconds: this.SESSION_DURATION_S,
                accessToken: data.accessToken,
                userId: data.user.id,
            });

            return sessionToken;
        });
    }

    public async refreshSession(sessionToken: string) {
        const tokenData = await this.getDataFromSessionToken(sessionToken);
        if (!tokenData) {
            throw new Error('Cannot refresh invalid/expired session');
        }

        const newSession = await this.createNewSession({
            user: tokenData.user,
            accessToken: tokenData.session.accessToken,
        });
        await this.sessionRepository.deleteSessionById(sessionToken);

        return newSession;
    }

    /**
     * Returns the user associated with the given session token, or null if the session is invalid/expired.
     */
    public async getDataFromSessionToken(
        sessionToken: string
    ): Promise<{ user: OidcService.UserInfo; session: SessionEntry } | null> {
        const session =
            await this.sessionRepository.getValidSessionByToken(sessionToken);
        if (!session) {
            return null;
        }
        const user = await this.userRepository.getUserById(session.userId);
        if (!user) {
            return null;
        }
        return { user, session };
    }

    public async deleteSession(sessionToken: string) {
        await this.sessionRepository.deleteSessionById(sessionToken);
    }

    public async clearExpiredSessions() {
        await this.sessionRepository.deleteExpiredSessions();
    }
}
