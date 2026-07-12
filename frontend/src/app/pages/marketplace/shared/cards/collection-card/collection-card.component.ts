import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExtendedCollectionVersion } from 'fuesim-digital-shared';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-collection-card',
    templateUrl: './collection-card.component.html',
    styleUrl: './collection-card.component.scss',
    imports: [RouterLink, DatePipe, NgbTooltip],
})
export class CollectionCardComponent {
    public readonly collection = input.required<ExtendedCollectionVersion>();
    public readonly fromLocation = input<string>('mycollections');
    public readonly noLink = input(false);
}
