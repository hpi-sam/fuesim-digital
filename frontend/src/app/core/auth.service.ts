import { Injectable, signal, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
    AuthQueryParams,
    UserDataResponse,
    userDataResponseSchema,
} from 'digital-fuesim-manv-shared';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly httpClient = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    public readonly SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

    readonly authData = signal<UserDataResponse>({
        user: undefined,
    });

    constructor() {
        this.fetchUserData();
        this.handleAuthMessageToast();
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

    private handleAuthMessageToast() {
        this.route.queryParams.subscribe((params: AuthQueryParams) => {
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

            this.router.navigate([], {
                queryParams: {
                    loginFailure: null,
                    logoutStatus: null,
                    loginSuccess: null,
                },
                queryParamsHandling: 'merge',
            });
        });
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
