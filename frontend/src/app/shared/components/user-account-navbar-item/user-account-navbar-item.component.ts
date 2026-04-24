import { Component, inject } from '@angular/core';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-user-account-navbar-item',
    templateUrl: './user-account-navbar-item.component.html',
    styleUrls: ['./user-account-navbar-item.component.scss'],
    imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
})
export class UserAccountNavbarItemComponent {
    readonly auth = inject(AuthService);

    public loginUrl = this.auth.loginUrl;
    public logoutUrl = this.auth.logoutUrl;
    public userSelfServiceUrl = this.auth.userSelfServiceUrl;
    public userRegistrationsUrl = this.auth.userRegistrationsUrl;
}
