import { Injectable, signal, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import {
    AuthQueryParams,
    UserDataResponse,
    userDataResponseSchema,
} from 'fuesim-digital-shared';
import { Location as NgLocation } from '@angular/common';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly httpClient = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly location = inject(NgLocation);
    private readonly messageService = inject(MessageService);

    public readonly SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

    readonly authData = signal<UserDataResponse>({
        user: undefined,
    });

    public async initialize() {
        this.setupQueryParamsHandler();
        return this.fetchUserData();
    }

    private async refreshSessionHandler() {
        const authData = this.authData();
        if (!authData.user) return;
        setInterval(() => {
            lastValueFrom(
                this.httpClient.get(`${httpOrigin}/api/auth/refresh-session`, {
                    withCredentials: true,
                })
            )
                .then((result) => {
                    // Session refreshed
                })
                .catch((err) => {
                    this.messageService.postMessage({
                        title: 'Sitzung abgelaufen',
                        color: 'warning',
                        body: 'Ihre Sitzung konnte nicht verlängert werden. Bitte melden Sie sich erneut an.',
                    });
                });
        }, this.SESSION_REFRESH_INTERVAL_MS);
    }

    private async fetchUserData() {
        const userData = await lastValueFrom(
            this.httpClient.get<UserDataResponse | null>(
                `${httpOrigin}/api/auth/user-data`,
                { withCredentials: true }
            )
        ).catch(() => null);

        userDataResponseSchema.parse(userData);

        if (userData?.expired === true) {
            this.messageService.postMessage({
                title: 'Sitzung abgelaufen',
                color: 'warning',
                body: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
            });
        }

        this.authData.set(userData ?? { user: null });
        this.refreshSessionHandler();
    }

    private setupQueryParamsHandler() {
        this.route.queryParams.subscribe((params: AuthQueryParams) => {
            if (
                !params.logoutStatus &&
                !params.loginFailure &&
                !params.loginSuccess
            )
                return;

            const tree = this.router.parseUrl(this.router.url);
            this.showAuthMessageToast(params);
            this.clearQueryParams(tree);
        });
    }

    private clearQueryParams(tree: UrlTree) {
        delete tree.queryParams['logoutStatus'];
        delete tree.queryParams['loginFailure'];
        delete tree.queryParams['loginSuccess'];
        this.location.replaceState(this.router.serializeUrl(tree));
    }

    private showAuthMessageToast(params: AuthQueryParams) {
        switch (params.logoutStatus) {
            case 'loggedOut':
                this.messageService.postMessage({
                    title: 'Erfolgreich abgemeldet',
                    color: 'info',
                    body: 'Sie wurden erfolgreich abgemeldet.',
                });
                break;
            case 'noSessionFound':
                this.messageService.postMessage({
                    title: 'Abmeldung fehlgeschlagen',
                    color: 'warning',
                    body: 'Es wurde keine aktive Sitzung gefunden.',
                });
                break;
            case 'sessionExpired':
                this.messageService.postMessage({
                    title: 'Sitzung abgelaufen',
                    color: 'warning',
                    body: 'Ihre Sitzung ist abgelaufen.',
                });
                break;
            default:
                break;
        }

        if (params.loginFailure !== undefined) {
            this.messageService.postMessage({
                color: 'danger',
                title: 'Login fehlgeschlagen',
                body: params.loginFailure,
            });
        }

        if (params.loginSuccess !== undefined) {
            this.messageService.postMessage({
                color: 'success',
                title: 'Login erfolgreich',
                body: 'Willkommen zurück!',
            });
        }
    }

    public get loginUrl() {
        return `${httpOrigin}/api/auth/oidc-redirect`;
    }

    public get logoutUrl() {
        return `${httpOrigin}/api/auth/logout`;
    }

    public get userSelfServiceUrl() {
        return `${httpOrigin}/api/auth/self-service`;
    }

    public get userRegistrationsUrl() {
        return `${httpOrigin}/api/auth/register`;
    }
}
