import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { uuid } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectEocLogEntries,
    selectExerciseStatus,
} from '../../../../../../state/application/selectors/exercise.selectors';
import {
    selectCurrentMainRole,
    selectOwnClient,
} from '../../../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { FormatDurationPipe } from '../../../../../../shared/pipes/format-duration.pipe';

@Component({
    selector: 'app-eoc-log-interface',
    templateUrl: './eoc-log-interface.component.html',
    styleUrls: ['./eoc-log-interface.component.scss'],
    imports: [FormsModule, AutofocusDirective, AsyncPipe, FormatDurationPipe],
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

    public readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    public readonly exerciseStatus =
        this.store.selectSignal(selectExerciseStatus);
    public readonly interfaceDisabled = computed(
        () =>
            this.currentRole() !== 'trainer' &&
            this.exerciseStatus() !== 'running'
    );

    public async addEocLogEntry() {
        const response = await this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Add Log Entry',
            message: this.newLogEntry,
            name: selectStateSnapshot(selectOwnClient, this.store)!.name,
            isPrivate:
                this.currentRole() === 'trainer'
                    ? this.sendingPrivateLog
                    : false,
            id: uuid(),
        });
        if (response.success) {
            this.newLogEntry = '';
        }

        this.sendingPrivateLog = true;
    }
}
