import { Component, input } from '@angular/core';
import { Tag } from 'fuesim-digital-shared';

@Component({
    selector: 'app-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss'],
    standalone: false,
})
export class TagComponent {
    readonly tag = input.required<Tag>();
}
