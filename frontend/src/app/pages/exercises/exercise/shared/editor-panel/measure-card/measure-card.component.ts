import {
    Component,
    input,
    output,
    ChangeDetectionStrategy,
} from '@angular/core';

@Component({
    selector: 'app-measure-card',
    templateUrl: './measure-card.component.html',
    styleUrl: './measure-card.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [],
})
export class MeasureCardComponent {
    readonly elementEdit = output();
    readonly elementDelete = output();

    readonly dataCy = input('');
    readonly name = input('');
    readonly enableEditButton = input(false);
    readonly enableDeleteButton = input(false);
}
