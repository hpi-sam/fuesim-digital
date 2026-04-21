import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-generic-element-card',
    imports: [],
    templateUrl: './generic-element-card.component.html',
    styleUrl: './generic-element-card.component.scss',
})
export class GenericElementCardComponent {
    public readonly title = input.required<string>();
    public readonly subtitle = input<string>();
    public readonly image = input<string>();

    public readonly editable = input<boolean>(true);

    public readonly delete = output();
    public readonly duplicate = output();
    public readonly restore = output();

    public readonly showCreatedIndicator = input<boolean>(false);
    public readonly showChangedIndicator = input<boolean>(false);
    public readonly showAsGhost = input<boolean>(false);
}
