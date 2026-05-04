import { Injectable, inject } from '@angular/core';
import {
    type ActivatedRouteSnapshot,
    type RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Injectable({
    providedIn: 'root',
})
export class IsAuthenticatedGuard {
    private readonly auth = inject(AuthService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        if (!this.auth.authData().user) {
            window.location.href = `${this.auth.loginUrl}?returnto=${window.location.pathname}`;
            return false;
        }
        return true;
    }
}
