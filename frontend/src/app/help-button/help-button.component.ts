import { Component, input } from '@angular/core';

@Component({
    selector: 'app-help-button',
    imports: [],
    templateUrl: './help-button.component.html',
    styleUrl: './help-button.component.scss',
})
export class HelpButtonComponent {
    readonly url = input.required<string>();
}
