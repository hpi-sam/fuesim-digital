import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectEocLogEntries } from '../../../../../../state/application/selectors/exercise.selectors';
import {
    selectCurrentMainRole,
    selectOwnClient,
} from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-eoc-log-interface',
    templateUrl: './eoc-log-interface.component.html',
    styleUrls: ['./eoc-log-interface.component.scss'],
    standalone: false,
})
export class EocLogInterfaceComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    public readonly eocLogEntries$ = this.store
        .select(selectEocLogEntries)
        // We want to display the most recent message at the top
        .pipe(map((logEntries) => [...logEntries].reverse()));

    public newLogEntry = '';

    public sendingPrivateLog = true;
    public readonly clientIsTrainer =
        selectStateSnapshot(selectCurrentMainRole, this.store) === 'trainer';

    public async addEocLogEntry() {
        const response = await this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Add Log Entry',
            message: this.newLogEntry,
            name: selectStateSnapshot(selectOwnClient, this.store)!.name,
            isPrivate: this.clientIsTrainer ? this.sendingPrivateLog : false,
        });
        if (response.success) {
            this.newLogEntry = '';
        }

        this.sendingPrivateLog = true;
    }
}
