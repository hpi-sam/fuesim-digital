import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-privacy',
    templateUrl: './privacy.component.html',
    styleUrls: ['./privacy.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AboutPlaceholderComponent],
})
export class PrivacyComponent {}
