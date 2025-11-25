import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import {
    selectClients,
    selectViewports,
} from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-client-overview-table',
    templateUrl: './client-overview-table.component.html',
    styleUrls: ['./client-overview-table.component.scss'],
    standalone: false,
})
export class ClientOverviewTableComponent {
    public readonly clients$ = this.store.select(selectClients);
    public readonly viewports$ = this.store.select(selectViewports);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    public async restrictToViewport(
        clientId: UUID,
        viewportId: UUID | undefined
    ) {
        this.exerciseService.proposeAction({
            type: '[Client] Restrict to viewport',
            clientId,
            viewportId,
        });
    }

    public async setWaitingRoom(
        clientId: UUID,
        shouldBeInWaitingRoom: boolean
    ) {
        this.exerciseService.proposeAction({
            type: '[Client] Set waitingroom',
            clientId,
            shouldBeInWaitingRoom,
        });
    }
}
