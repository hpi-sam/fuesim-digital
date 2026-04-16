import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { MapOperatorToolbarComponent } from '../map-operator-toolbar/map-operator-toolbar.component';
import { AppState } from '../../../../../state/app.state';
import {
    selectExerciseStatus,
    selectMeasureTemplates,
} from '../../../../../state/application/selectors/exercise.selectors';

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
    private readonly store = inject<Store<AppState>>(Store);
    readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);

    public readonly exerciseStatus =
        this.store.selectSignal(selectExerciseStatus);

    private readonly measureTemplatesMap = this.store.selectSignal(
        selectMeasureTemplates
    );

    public readonly doMeasuresExist = computed(
        () => Object.values(this.measureTemplatesMap()).length > 0
    );
}
