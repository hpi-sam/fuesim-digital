import { Config } from "config.js";
import { stringifyCookie, stringifySetCookie } from "cookie";
import { Request, Response } from "express"
import { stat } from "node:fs";
import * as oidc from 'openid-client'


export class AuthService {
    private _config: oidc.Configuration | null = null;
    private _publicUrl: string = Config.httpPublicUrl;
    private static readonly redirectPath = "/api/auth/oidc-callback";

    public get config(): oidc.Configuration {
        if (this._config === null) {
            throw new Error("AuthService not initialized");
        }
        return this._config;
    }

    public async initialize() {
        try {
            Config.initialize()
            this._config = await oidc.discovery(
                new URL(Config.authUrl),
                Config.authClientId,
                Config.authClientSecret,
                undefined,
                {
                    execute: process.env["NODE_ENV"] === "development" ? [
                        /**
                         * Marked as deprecated only to make it stand out as something you shouldn't
                         * have the need to use, possibly only for local development and testing
                         * against non-TLS secured environments.
                         * https://github.com/panva/openid-client/blob/01f5fe37cbe78c8c2624f0e568fc3a7d4d2386eb/docs/functions/allowInsecureRequests.md
                         */
                        oidc.allowInsecureRequests
                    ] : undefined
                }
            );
            this._publicUrl = Config.httpPublicUrl;
            return this;
        }
        catch (err) {
            console.log("AuthService initialisation failed")
            throw err;
        }
    }

    public async getAuthUrl(): Promise<{ url: URL, cookies: { name: string, value: string }[] }> {
        // see https://github.com/panva/openid-client/blob/01f5fe37cbe78c8c2624f0e568fc3a7d4d2386eb/README.md
        const codeVerifier = oidc.randomPKCECodeVerifier()
        const codeChallenge =
            await oidc.calculatePKCECodeChallenge(codeVerifier);
        const state = oidc.randomState();

        const parameters: { [key: string]: string } = {
            redirect_uri: this._publicUrl + AuthService.redirectPath,
            scope: "openid profile email",
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state,
        }

        const cookies = [
            { name: "code-verifier", value: codeVerifier },
            { name: "state", value: state }
        ]

        return { url: oidc.buildAuthorizationUrl(this.config, parameters), cookies };
    }
    public async handleRedirect(req: Request, res: Response) {
        const authUrl = await this.getAuthUrl();

        for (let cookie of authUrl.cookies) {
            res.cookie(cookie.name, cookie.value, { httpOnly: true, path: "/api/auth/oidc-callback", sameSite: true })
            console.log(cookie);
        }

        res.redirect(authUrl.url.toString());
    }

    public async handleCallback(req: Request, res: Response) {
        // TODO @Quixelation
        // - [ ] check if error: http://localhost:3201/api/auth/oidc-callback?error=invalid_state&error_description=The+state+is+missing+or+does+not+have+enough+characters+and+is+therefore+considered+too+weak.+Request+parameter+%27state%27+must+be+at+least+be+8+characters+long+to+ensure+sufficient+entropy.&iss=http%3A%2F%2F127.0.0.1%3A9091
        // - [ ] get code from query
        // - [ ] exchange code for tokens
        // - [ ] set session or cookie to jwt
        // - [ ] implement function to verify said jwt on requests

        console.log(req.cookies)
        console.log(req.cookies["state"])

        //oidc.useIdTokenResponseType
        res.send();
    }
}
