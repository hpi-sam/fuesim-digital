import { Component, output, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AppState } from '../../../state/app.state';

@Component({
    selector: 'app-map-editor-card',
    templateUrl: './map-editor-card.component.html',
    styleUrls: ['./map-editor-card.component.scss'],
    imports: [NgbTooltip],
})
export class MapEditorCardComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly elementMousedown = output<MouseEvent>();
    readonly elementEdit = output();
    readonly elementDelete = output();

    readonly dataCy = input('');
    readonly title = input('');
    readonly imageUrl = input('');
    readonly darkBackground = input(false);
    readonly enableEditButton = input(false);
    readonly enableDeleteButton = input(false);
    readonly selected = input(false);
}
