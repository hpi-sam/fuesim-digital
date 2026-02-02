import { Component } from '@angular/core';
import type { UserDataResponse } from 'digital-fuesim-manv-shared';
import { type Observable } from 'rxjs';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-user-account-navbar-item',
    templateUrl: './user-account-navbar-item.component.html',
    styleUrls: ['./user-account-navbar-item.component.scss'],
    standalone: false,
})
export class UserAccountNavbarItemComponent {
    public userData$?: Observable<UserDataResponse> = this.auth.userData$;
    public loginUrl = this.auth.loginUrl;
    public logoutUrl = this.auth.logoutUrl;
    public userSelfServiceUrl = this.auth.userSelfServiceUrl;
    public userRegistrationsUrl = this.auth.userRegistrationsUrl;

    constructor(private readonly auth: AuthService) {}
}
