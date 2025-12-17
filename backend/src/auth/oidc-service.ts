import * as oidc from 'openid-client';
import type { Request, Response } from 'express';
import { Config } from 'config.js';
import { toFrontend } from '../utils/frontend-http-helper.js';
import type { AuthService } from './auth-service.js';

export namespace OidcService {
    export interface UserInfo {
        id: string;
        display_name: string;
        username: string;
    }
}

export class OidcService {
    private _config: oidc.Configuration | null = null;
    private _publicUrl: string = Config.httpBackendUrl;
    private static readonly redirectPath = '/api/auth/oidc-callback';

    constructor(private readonly authService: AuthService) { }

    public get config(): oidc.Configuration {
        if (this._config === null) {
            throw new Error('AuthService not initialized');
        }
        return this._config;
    }

    public async initialize() {
        try {
            Config.initialize();
            this._config = await oidc.discovery(
                new URL(Config.authUrl),
                Config.authClientId,
                Config.authClientSecret,
                undefined,
                {
                    execute:
                        process.env['NODE_ENV'] === 'development'
                            ? [
                                /**
                                 * Marked as deprecated only to make it stand out as something you shouldn't
                                 * have the need to use, possibly only for local development and testing
                                 * against non-TLS secured environments.
                                 * https://github.com/panva/openid-client/blob/01f5fe37cbe78c8c2624f0e568fc3a7d4d2386eb/docs/functions/allowInsecureRequests.md
                                 */
                                oidc.allowInsecureRequests,
                            ]
                            : undefined,
                }
            );
            this._publicUrl = Config.httpBackendUrl;
            return this;
        } catch (err) {
            console.log('OidcService initialisation failed');
            throw err;
        }
    }

    public async getAuthUrl(opts?: { returnTo?: string }): Promise<{
        url: URL;
        cookies: { name: string; value: string }[];
    }> {
        // see https://github.com/panva/openid-client/blob/01f5fe37cbe78c8c2624f0e568fc3a7d4d2386eb/README.md
        const codeVerifier = oidc.randomPKCECodeVerifier();
        const codeChallenge =
            await oidc.calculatePKCECodeChallenge(codeVerifier);
        const state = oidc.randomState().substring(0, 43).padEnd(43, '=') + (opts?.returnTo ?? "");

        const parameters: { [key: string]: string } = {
            redirect_uri: this._publicUrl + OidcService.redirectPath,
            scope: 'openid profile email',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state,
        };

        const cookies = [
            { name: 'code-verifier', value: codeVerifier },
            { name: 'state', value: state },
        ];


        return {
            url: oidc.buildAuthorizationUrl(this.config, parameters),
            cookies,
        };
    }
    public async handleRedirect(req: Request, res: Response) {
        const returnToPath = req.query["returnto"] as string | undefined;
        const authUrl = await this.getAuthUrl({returnTo: returnToPath});

        for (const cookie of authUrl.cookies) {
            res.cookie(cookie.name, cookie.value, {
                httpOnly: true,
                path: '/api/auth/oidc-callback',
                sameSite: 'lax',
            });
        }

        res.redirect(authUrl.url.toString());
    }

    public async handleRegistrationRedirect(req: Request, res: Response) {

    }

    public async handleCallback(req: Request, res: Response) {
        const state = req.cookies['state'];
        const codeVerifier = req.cookies['code-verifier'];

        if (state === undefined || codeVerifier === undefined) {
            res.redirect(
                toFrontend(undefined, {
                    loginfailure: 'Unvollständige Anmeldung',
                })
            );
            return;
        }

        const fullUrl = new URL(
            `${req.protocol}://${req.host}${req.originalUrl}`
        );

        const tokens = await oidc.authorizationCodeGrant(this.config, fullUrl, {
            expectedState: state,
            pkceCodeVerifier: codeVerifier,
        });
        res.clearCookie('code-verifier');
        res.clearCookie('state');


        const userInfo = await this.fetchUserInfo(tokens.access_token);

        const sessionToken = await this.authService.createNewSession({
            user: userInfo,
            accessToken: tokens.access_token,
        });

        const returnTo = state.length > 43 ? state.substring(43) : undefined;

        res.cookie(this.authService.SESSION_COOKIE_NAME, sessionToken, {
            httpOnly: true,
        }).redirect(toFrontend(returnTo, { loginsuccess: true }));
    }


    public async fetchUserInfo(
        accessToken: string
    ): Promise<OidcService.UserInfo> {
        const userInfo = await oidc.fetchUserInfo(
            this.config,
            accessToken,
            // we dont have a stored sub to verify against, so we skip this
            oidc.skipSubjectCheck
        );

        const username = userInfo.preferred_username ?? userInfo.email ?? null;
        const displayName = userInfo.name ?? username ?? null;

        return {
            id: userInfo.sub,
            display_name: displayName ?? 'NONAME',
            username: username ?? 'NOUSERNAME',
        };
    }

    public async getSingleSignOutUrl() {
        if (!this.config.serverMetadata().frontchannel_logout_supported) {
            return null;
        }
        return oidc.buildEndSessionUrl(this.config, {
            post_logout_redirect_uri: toFrontend(undefined, { logoutstatus: 'loggedout' }),
        });
    }
}
