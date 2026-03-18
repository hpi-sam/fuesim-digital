import { Component, input } from '@angular/core';
import { environment } from '../../environments/environment.js';

@Component({
    selector: 'app-help-button',
    imports: [],
    templateUrl: './help-button.component.html',
    styleUrl: './help-button.component.scss',
})
export class HelpButtonComponent {
    readonly url = input.required<string>();
    readonly docsUrl = environment.docsUrl;
}
