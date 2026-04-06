import { Component, inject, input, resource } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CollectionService } from '../../../core/exercise-element.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionDto } from 'fuesim-digital-shared';

@Component({
    selector: 'app-collection-card',
    templateUrl: './collection-card.component.html',
    styleUrl: './collection-card.component.scss',
    imports: [RouterLink, DatePipe],
})
export class CollectionCardComponent {
    public readonly collection = input.required<CollectionDto>();
    public readonly fromLocation = input.required<string>();
}
