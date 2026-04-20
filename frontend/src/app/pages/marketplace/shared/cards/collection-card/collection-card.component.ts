import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CountedCollectionDto } from 'fuesim-digital-shared';

@Component({
    selector: 'app-collection-card',
    templateUrl: './collection-card.component.html',
    styleUrl: './collection-card.component.scss',
    imports: [RouterLink, DatePipe],
})
export class CollectionCardComponent {
    public readonly collection = input.required<CountedCollectionDto>();
    public readonly fromLocation = input.required<string>();
}
