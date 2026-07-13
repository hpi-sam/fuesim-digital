import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { RouterOutlet } from '@angular/router';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { TrainerToolbarComponent } from '../trainer-toolbar/trainer-toolbar.component';
import { AppState } from '../../../../../state/app.state';
import { selectCurrentMainRole } from '../../../../../state/application/selectors/shared.selectors';
import { selectExerciseStateMode } from '../../../../../state/application/selectors/application.selectors';
import { TimeTravelToolbarComponent } from '../time-travel-toolbar/time-travel-toolbar.component';

@Component({
    selector: 'app-map-view',
    imports: [
        ExerciseMapComponent,
        TrainerToolbarComponent,
        RouterOutlet,
        TimeTravelToolbarComponent,
    ],
    templateUrl: './map-view.component.html',
    styleUrl: './map-view.component.scss',
})
export class MapViewComponent {
    private readonly store = inject<Store<AppState>>(Store);

    protected readonly role = this.store.selectSignal(selectCurrentMainRole);
    public readonly exerciseStateMode = this.store.selectSignal(
        selectExerciseStateMode
    );
}
