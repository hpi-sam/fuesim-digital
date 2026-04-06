import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
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
        return !!this.auth.authData().user;
    }
}
