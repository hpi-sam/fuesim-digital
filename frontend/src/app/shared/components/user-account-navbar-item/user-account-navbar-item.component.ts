import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-user-account-navbar-item',
    templateUrl: './user-account-navbar-item.component.html',
    styleUrls: ['./user-account-navbar-item.component.scss'],
    standalone: false,
})
export class UserAccountNavbarItemComponent {
    public loginUrl = this.auth.loginUrl;
    public logoutUrl = this.auth.logoutUrl;
    public userSelfServiceUrl = this.auth.userSelfServiceUrl;
    public userRegistrationsUrl = this.auth.userRegistrationsUrl;

    constructor(readonly auth: AuthService) {}
}
