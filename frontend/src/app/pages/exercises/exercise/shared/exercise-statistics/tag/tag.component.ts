import { Component, input } from '@angular/core';
import type { Tag } from 'fuesim-digital-shared';

@Component({
    selector: 'app-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss'],
})
export class TagComponent {
    readonly tag = input.required<Tag>();
}
