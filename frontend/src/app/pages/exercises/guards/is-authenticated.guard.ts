import { Injectable } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Injectable({
    providedIn: 'root',
})
export class IsAuthenticatedGuard {
    constructor(private readonly auth: AuthService) {}

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        return !!this.auth.authData().user;
    }
}
