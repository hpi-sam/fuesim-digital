import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    NgbNav,
    NgbNavItem,
    NgbNavItemRole,
    NgbNavLink,
    NgbNavLinkBase,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { UserAccountNavbarItemComponent } from '../user-account-navbar-item/user-account-navbar-item.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [
        RouterLink,
        NgbNav,
        NgbNavItem,
        NgbNavItemRole,
        NgbNavLink,
        NgbNavLinkBase,
        UserAccountNavbarItemComponent,
        AsyncPipe,
    ],
})
export class HeaderComponent {
    route = inject(ActivatedRoute);
    readonly auth = inject(AuthService);
}
