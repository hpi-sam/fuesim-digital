import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-terms',
    templateUrl: './terms.component.html',
    styleUrls: ['./terms.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AboutPlaceholderComponent],
})
export class TermsComponent {}
