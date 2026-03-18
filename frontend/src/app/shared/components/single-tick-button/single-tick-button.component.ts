import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';

@Component({
    selector: 'app-single-tick-button',
    templateUrl: './single-tick-button.component.html',
    styleUrl: './single-tick-button.component.scss',
})
export class SingleTickButtonComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);


    public async doTick() {
         await this.exerciseService.proposeAction({type: '[Exercise] Tick', tickInterval: 1000, patientUpdates: [], refreshTreatments: true})
    }
}
