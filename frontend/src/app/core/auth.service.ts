import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { UserDataResponse } from 'digital-fuesim-manv-shared';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly user$ = new BehaviorSubject<UserDataResponse>({ user: undefined });

    public readonly userData$ = this.user$.asObservable();

    constructor(
        private readonly httpClient: HttpClient,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly messageService: MessageService
    ) {
        this.fetchUserData();
        this.handleLoginFailureToast();
    }

    private async fetchUserData() {
        const userData = await lastValueFrom(
            this.httpClient.get<UserDataResponse | null>(
                `${httpOrigin}/api/auth/user-data`,
                { withCredentials: true }
            )
        ).catch(() => null);

        if (userData?.expired === true) {
            this.messageService.postMessage({
                title: 'Sitzung abgelaufen',
                color: 'warning',
                body: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
            });
        }

        this.user$.next(userData ?? { user: null });
    }

    private handleLoginFailureToast() {
        this.route.queryParams.subscribe((params) => {
            if (params['logoutstatus'] != null) {
                switch (params['logoutstatus']) {
                    case 'loggedout':
                        this.messageService.postMessage({
                            title: 'Erfolgreich abgemeldet',
                            color: 'info',
                            body: 'Sie wurden erfolgreich abgemeldet.',
                        });
                        break;
                    case 'nosessionfound':
                        this.messageService.postMessage({
                            title: 'Abmeldung fehlgeschlagen',
                            color: 'warning',
                            body: 'Es wurde keine aktive Sitzung gefunden.',
                        });
                        break;
                    case 'sessionexpired':
                        this.messageService.postMessage({
                            title: 'Sitzung abgelaufen',
                            color: 'warning',
                            body: 'Ihre Sitzung ist abgelaufen.',
                        });
                        break;
                }
            }

            if (params['loginfailure'] != null) {
                this.messageService.postError({
                    title: 'Login fehlgeschlagen',
                    body: params['loginfailure'],
                });
            }

            this.router.navigate([], {
                queryParams: {
                    loginfailure: null,
                    logoutstatus: null,
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
}
