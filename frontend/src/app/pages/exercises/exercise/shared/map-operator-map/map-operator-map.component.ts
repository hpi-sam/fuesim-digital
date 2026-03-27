import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { MapOperatorToolbarComponent } from '../map-operator-toolbar/map-operator-toolbar.component';

@Component({
    selector: 'app-map-operator-map-editor',
    templateUrl: './map-operator-map.component.html',
    styleUrls: ['./map-operator-map.component.scss'],
    imports: [ExerciseMapComponent, FormsModule, MapOperatorToolbarComponent],
})
/**
 * A wrapper around the map that allows map operators to take measures.
 */
export class MapOperatorMapComponent {
    readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);

    public readonly isToolbarVisible = signal(true);

    public toggleToolbar() {
        this.isToolbarVisible.update((value) => !value);
    }

    @HostListener('document:mousedown', ['$event'])
    public onDocumentMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (target.closest('app-map-operator-toolbar, .map-toolbar-toggle')) {
            return;
        }
        this.isToolbarVisible.set(false);
    }
}
