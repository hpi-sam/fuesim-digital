import { Component } from '@angular/core';
import { AboutPlaceholderComponent } from '../about-placeholder/about-placeholder.component';

@Component({
    selector: 'app-imprint',
    templateUrl: './imprint.component.html',
    styleUrls: ['./imprint.component.scss'],
    imports: [AboutPlaceholderComponent],
})
export class ImprintComponent {}
