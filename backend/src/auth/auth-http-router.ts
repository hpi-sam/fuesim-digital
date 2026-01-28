import type {
    UserDataResponse} from 'digital-fuesim-manv-shared';
import {
    userDataResponseSchema,
} from 'digital-fuesim-manv-shared';
import { secureHttp } from '../exercise/http-handler/secure-http.js';
import { HttpRouter } from '../http-router.js';
import { toFrontend } from '../utils/frontend-http-helper.js';
import type { AuthService } from './auth-service.js';

export class AuthHttpRouter extends HttpRouter {
    public constructor(private readonly authService: AuthService) {
        super();
    }

    protected initializeRoutes() {
        this.router.get('/register', (req, res) => {
            try {
                this.authService.oidcService.handleRegistrationRedirect(
                    req,
                    res
                );
            } catch {
                res.redirect(
                    toFrontend(undefined, {
                        loginfailure: 'Anmeldung fehlgeschlagen',
                    })
                );
            }
        });

        this.router.get('/oidc-redirect', (req, res) => {
            try {
                this.authService.oidcService.handleLoginRedirect(req, res);
            } catch {
                res.redirect(
                    toFrontend(undefined, {
                        loginfailure: 'Anmeldung fehlgeschlagen',
                    })
                );
            }
        });

        this.router.get('/oidc-callback', async (req, res) => {
            try {
                await this.authService.oidcService.handleCallback(req, res);
            } catch {
                res.redirect(
                    toFrontend(undefined, {
                        loginfailure: 'Anmeldung fehlgeschlagen',
                    })
                );
            }
        });

        this.router.get('/user-data', async (req, res) =>
            secureHttp<UserDataResponse>(
                async () => {
                    const sessionToken =
                        req.cookies[this.authService.SESSION_COOKIE_NAME];
                    const sessionTokenData = sessionToken
                        ? await this.authService.getDataFromSessionToken(
                              sessionToken
                          )
                        : null;

                    const sessionIsExpired = sessionToken && !sessionTokenData;

                    return {
                        statusCode: 200,
                        body: userDataResponseSchema.encode({
                            user: sessionTokenData?.user ?? null,
                            expired: sessionIsExpired,
                            userRegistrationsEnabled:
                                this.authService.oidcService
                                    .userRegistrationEnabled,
                            userSelfServiceEnabled:
                                this.authService.oidcService
                                    .userSelfServiceEnabled,
                        }),
                        cookies: sessionIsExpired
                            ? [
                                  {
                                      name: this.authService
                                          .SESSION_COOKIE_NAME,
                                      value: null,
                                  },
                              ]
                            : [],
                    };
                },
                req,
                res
            )
        );

        this.router.get('/self-service', async (req, res) => {
            try {
                await this.authService.oidcService.handleSelfServiceRedirect(
                    req,
                    res
                );
            } catch {
                res.redirect(
                    toFrontend(undefined, {
                        loginfailure:
                            'Benutzer-Selbstverwaltung fehlgeschlagen',
                    })
                );
            }
        });

        this.router.post('/refresh-session', async (req, res) => {
            const sessionToken =
                req.cookies[this.authService.SESSION_COOKIE_NAME];
            if (!sessionToken) {
                res.status(400).json({ error: 'No session token provided' });
                return;
            }

            try {
                const newSessionToken =
                    await this.authService.refreshSession(sessionToken);

                res.cookie(
                    this.authService.SESSION_COOKIE_NAME,
                    newSessionToken,
                    {
                        httpOnly: true,
                        sameSite: 'lax',
                    }
                );

                res.status(200).json({ message: 'Session refreshed' });
            } catch {
                res.status(400).json({ error: 'Failed to refresh session' });
            }
        });

        this.router.get('/logout', async (req, res) => {
            const sessionToken =
                req.cookies[this.authService.SESSION_COOKIE_NAME];
            if (!sessionToken) {
                res.redirect(
                    toFrontend(undefined, { logoutstatus: 'nosessionfound' })
                );
                return;
            }

            await this.authService.deleteSession(sessionToken);

            res.clearCookie(this.authService.SESSION_COOKIE_NAME);

            const logoutUrl =
                await this.authService.oidcService.getSingleSignOutUrl();
            if (!logoutUrl) {
                res.redirect(
                    toFrontend(undefined, { logoutstatus: 'loggedout' })
                );
                return;
            }
            res.redirect(logoutUrl.toString());
        });
    }
}
