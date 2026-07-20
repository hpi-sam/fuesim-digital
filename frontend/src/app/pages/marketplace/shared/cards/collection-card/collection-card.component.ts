import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExtendedCollectionVersion } from 'fuesim-digital-shared';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../../core/exercise-element.service';

@Component({
    selector: 'app-collection-card',
    templateUrl: './collection-card.component.html',
    styleUrl: './collection-card.component.scss',
    imports: [RouterLink, DatePipe, NgbTooltip],
})
export class CollectionCardComponent {
    private readonly collectionService: any = inject(CollectionService);

    public readonly collection = input.required<ExtendedCollectionVersion>();
    public readonly fromLocation = input<string>('mycollections');
    public readonly noLink = input(false);
    public readonly showArchiveButton = input(false);

    public readonly archive = output();

    public readonly versioningEnabled =
        this.collectionService.versioningEnabled;
}
