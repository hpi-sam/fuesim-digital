import { Component, output, input } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-map-editor-card',
    templateUrl: './map-editor-card.component.html',
    styleUrls: ['./map-editor-card.component.scss'],
    imports: [NgbTooltip],
})
export class MapEditorCardComponent {
    readonly elementPointerdown = output<PointerEvent>();
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
