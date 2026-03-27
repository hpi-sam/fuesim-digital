import { userDataResponseSchema } from 'fuesim-digital-shared';
import { Router } from 'express';
import type { AuthService } from '../auth/auth-service.js';
import { toFrontend } from '../utils/frontend-http-helper.js';
import { warnError } from '../utils/http-handlers.js';

export const createAuthRouter = (authService: AuthService) => {
    const router = Router();

    router.get('/register', (req, res) => {
        try {
            authService.oidcService.handleRegistrationRedirect(req, res);
        } catch (err) {
            warnError(req, err);
            res.redirect(
                toFrontend(undefined, {
                    loginFailure: 'Anmeldung fehlgeschlagen',
                })
            );
        }
    });

    router.get('/oidc-redirect', async (req, res) => {
        try {
            await authService.oidcService.handleLoginRedirect(req, res);
        } catch (err) {
            warnError(req, err);
            res.redirect(
                toFrontend(undefined, {
                    loginFailure: 'Anmeldung fehlgeschlagen',
                })
            );
        }
    });

    router.get('/oidc-callback', async (req, res) => {
        try {
            await authService.oidcService.handleCallback(req, res);
        } catch (err) {
            warnError(req, err);
            res.redirect(
                toFrontend(undefined, {
                    loginFailure: 'Anmeldung fehlgeschlagen',
                })
            );
        }
    });

    router.get('/user-data', async (req, res) => {
        const sessionToken = req.cookies[authService.SESSION_COOKIE_NAME];
        const sessionTokenData = sessionToken
            ? await authService.getDataFromSessionToken(sessionToken)
            : null;

        const sessionIsExpired = sessionToken && !sessionTokenData;

        if (sessionIsExpired) {
            res.clearCookie(authService.SESSION_COOKIE_NAME);
        }

        res.send(
            userDataResponseSchema.encode({
                user: sessionTokenData?.user ?? null,
                expired: sessionIsExpired,
                userRegistrationsEnabled:
                    authService.oidcService.userRegistrationEnabled,
                userSelfServiceEnabled:
                    authService.oidcService.userSelfServiceEnabled,
            })
        );
    });

    router.post('/refresh-session', async (req, res) => {
        const sessionToken = req.cookies[authService.SESSION_COOKIE_NAME];
        if (!sessionToken) {
            res.status(400).send({ error: 'No session token provided' });
            return;
        }

        try {
            const newSessionToken =
                await authService.refreshSession(sessionToken);

            res.cookie(authService.SESSION_COOKIE_NAME, newSessionToken, {
                httpOnly: true,
                sameSite: 'lax',
            });

            res.status(200).send({ message: 'Session refreshed' });
        } catch (err) {
            warnError(req, err);
            res.status(400).send({ error: 'Failed to refresh session' });
        }
    });

    router.get('/logout', async (req, res) => {
        const sessionToken = req.cookies[authService.SESSION_COOKIE_NAME];
        if (!sessionToken) {
            res.redirect(
                toFrontend(undefined, { logoutStatus: 'noSessionFound' })
            );
            return;
        }

        await authService.deleteSession(sessionToken);

        res.clearCookie(authService.SESSION_COOKIE_NAME);

        const logoutUrl = await authService.oidcService.getSingleSignOutUrl();
        if (!logoutUrl) {
            res.redirect(toFrontend(undefined, { logoutStatus: 'loggedOut' }));
            return;
        }
        res.redirect(logoutUrl.toString());
    });

    return router;
};
