import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { SpecificRole } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectClients,
    selectViewports,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-client-overview-table',
    templateUrl: './client-overview-table.component.html',
    styleUrls: ['./client-overview-table.component.scss'],
    standalone: false,
})
export class ClientOverviewTableComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    public readonly clients$ = this.store.select(selectClients);
    public readonly viewports$ = this.store.select(selectViewports);

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

    public async changeToSpecificRole(clientId: UUID, newRole: SpecificRole) {
        this.exerciseService.proposeAction({
            type: '[Client] Change specific client role',
            clientId,
            newRole,
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
