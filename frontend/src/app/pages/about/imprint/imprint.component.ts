import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-imprint',
    templateUrl: './imprint.component.html',
    styleUrls: ['./imprint.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AboutPlaceholderComponent],
})
export class ImprintComponent {}
