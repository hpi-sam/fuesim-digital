import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false,
})
export class HeaderComponent {
    constructor(
        public route: ActivatedRoute,
        public readonly auth: AuthService
    ) {}
}
