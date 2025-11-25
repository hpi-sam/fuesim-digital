import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import { selectEocLogEntries } from 'src/app/state/application/selectors/exercise.selectors.js';
import { selectOwnClient } from 'src/app/state/application/selectors/shared.selectors.js';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot.js';

@Component({
    selector: 'app-eoc-log-interface',
    templateUrl: './eoc-log-interface.component.html',
    styleUrls: ['./eoc-log-interface.component.scss'],
    standalone: false,
})
export class EocLogInterfaceComponent {
    public readonly eocLogEntries$ = this.store
        .select(selectEocLogEntries)
        // We want to display the most recent message at the top
        .pipe(map((logEntries) => [...logEntries].reverse()));

    public newLogEntry = '';

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    public async addEocLogEntry() {
        const response = await this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Add Log Entry',
            message: this.newLogEntry,
            name: selectStateSnapshot(selectOwnClient, this.store)!.name,
        });
        if (response.success) {
            this.newLogEntry = '';
        }
    }
}
