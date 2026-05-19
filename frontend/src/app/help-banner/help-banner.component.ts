import { Component, input } from '@angular/core';

@Component({
    selector: 'app-help-banner',
    imports: [],
    templateUrl: './help-banner.component.html',
    styleUrl: './help-banner.component.scss',
})
export class HelpBannerComponent {
    readonly url = input.required<string>();
    readonly label = input.required<string>();
}
