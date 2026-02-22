import { Component, computed, input, output } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import {
    MarketplaceElementContent,
    marketplaceElementsDefinitions,
} from 'fuesim-digital-shared';

@Component({
    selector: 'app-marketplace-form-submit-button-bar',
    templateUrl: './submit-button-bar.component.html',
    styleUrl: './submit-button-bar.component.scss',
    imports: [],
})
export class MarketplaceFormSubmitButtonBarComponent {
    public readonly form =
        input.required<FieldTree<MarketplaceElementContent>>();
    public readonly type = input.required<MarketplaceElementContent['type']>();
    public readonly disabled = input<boolean>(false);

    public readonly submitData = output();
    public readonly discardChanges = output();

    public readonly submitButtonText = computed(() => {
        const type =
            marketplaceElementsDefinitions[this.type()].naming.singular;
        return `${type} speichern`;
    });
}
