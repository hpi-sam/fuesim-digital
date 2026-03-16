import { Component } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-license',
    templateUrl: './license.component.html',
    styleUrls: ['./license.component.scss'],
    imports: [AboutPlaceholderComponent],
})
export class LicenseComponent {}
