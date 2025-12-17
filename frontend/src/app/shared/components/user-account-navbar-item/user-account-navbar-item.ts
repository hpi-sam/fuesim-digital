import { Component } from '@angular/core';
import type { UserDataResponse } from 'digital-fuesim-manv-shared';
import { type Observable } from 'rxjs';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-user-account-navbar-item',
    templateUrl: './user-account-navbar-item.html',
    styleUrls: ['./user-account-navbar-item.scss'],
    standalone: false,
})
export class UserAccountNavbarItem {
    public userData$?: Observable<UserDataResponse> = this.auth.userData$;
    public loginUrl = this.auth.loginUrl;
    public logoutUrl = this.auth.logoutUrl;

    constructor(private readonly auth: AuthService) {}
}
