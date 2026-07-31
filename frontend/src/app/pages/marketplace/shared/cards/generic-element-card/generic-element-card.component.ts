import {
    Component,
    inject,
    InjectionToken,
    input,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

export type GenericElementCardIndicator =
    | 'changed'
    | 'created'
    | 'ghost'
    | 'selected';

@Component({
    selector: 'app-generic-element-card',
    templateUrl: './generic-element-card.component.html',
    styleUrl: './generic-element-card.component.scss',
    host: {
        '(click)': 'output.click()',
    },
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbDropdownModule, NgbTooltip],
})
export class GenericElementCardComponent {
    public readonly title = input.required<string>();
    public readonly subtitle = input<string>();
    public readonly image = input<string>();

    public readonly editable = input<boolean>(true);
    public readonly showSecondaryActions = input<boolean>(true);

    public readonly showIndicator = input<GenericElementCardIndicator>();
    public readonly small = input<boolean>(false);

    public readonly output = inject(GenericElementCardOutputInjectionToken);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const GenericElementCardOutputInjectionToken = new InjectionToken<{
    delete: () => void;
    duplicate: () => void;
    duplicateExternal: () => void;
    restore: () => void;
    click: () => void;
}>('GenericElementCardOutputInjectionToken');
