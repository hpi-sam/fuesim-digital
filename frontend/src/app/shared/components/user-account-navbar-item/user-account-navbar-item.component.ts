import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { environment } from '../../../../environments/environment.js';
import { ApiService } from '../../../core/api.service';
import { httpOrigin } from '../../../core/api-origins.js';

@Component({
    selector: 'app-user-account-navbar-item',
    templateUrl: './user-account-navbar-item.component.html',
    styleUrls: ['./user-account-navbar-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        RouterLink,
    ],
})
export class UserAccountNavbarItemComponent {
    readonly auth = inject(AuthService);
    readonly apiService = inject(ApiService);

    public loginUrl = this.auth.loginUrl;
    public logoutUrl = this.auth.logoutUrl;
    public userSelfServiceUrl = this.auth.userSelfServiceUrl;
    public userRegistrationsUrl = this.auth.userRegistrationsUrl;
    readonly docsUrl = environment.docsUrl;
    protected readonly httpOrigin = httpOrigin;
}
