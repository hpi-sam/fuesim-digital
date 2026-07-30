import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-license',
    templateUrl: './license.component.html',
    styleUrls: ['./license.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AboutPlaceholderComponent],
})
export class LicenseComponent {}
