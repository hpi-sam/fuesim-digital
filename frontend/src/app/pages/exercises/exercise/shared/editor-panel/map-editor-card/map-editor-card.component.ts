import { Component, Input, output, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../../../../../../state/app.state';

@Component({
    selector: 'app-map-editor-card',
    templateUrl: './map-editor-card.component.html',
    styleUrls: ['./map-editor-card.component.scss'],
    standalone: false,
})
export class MapEditorCardComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly elementMousedown = output<MouseEvent>();
    readonly elementEdit = output();
    readonly elementDelete = output();

    @Input() dataCy = '';
    @Input() title!: string;
    @Input() imageUrl!: string;
    @Input() darkBackground = false;
    @Input() enableEditButton = false;
    @Input() enableDeleteButton = false;
}
