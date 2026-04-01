import { Component, input, output } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-measure-card',
    templateUrl: './measure-card.component.html',
    styleUrl: './measure-card.component.scss',
    imports: [NgbTooltip],
})
export class MeasureCardComponent {
    readonly elementEdit = output();
    readonly elementDelete = output();

    readonly dataCy = input('');
    readonly name = input('');
    readonly enableEditButton = input(false);
    readonly enableDeleteButton = input(false);
}
