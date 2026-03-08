import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Transfer } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectCurrentTime } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-time-input',
    templateUrl: './transfer-time-input.component.html',
    styleUrls: ['./transfer-time-input.component.scss'],
    standalone: false,
})
export class TransferTimeInputComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input() elementType!: 'personnel' | 'vehicle';

    @Input() elementId!: UUID;

    @Input() transfer!: Transfer;

    public readonly currentTime$ = this.store.select(selectCurrentTime);

    public addTransferTime(timeToAdd: number) {
        this.exerciseService.proposeAction({
            type: '[Transfer] Edit transfer',
            elementType: this.elementType,
            elementId: this.elementId,
            timeToAdd,
        });
    }

    public togglePauseTransfer() {
        this.exerciseService.proposeAction({
            type: '[Transfer] Toggle pause transfer',
            elementType: this.elementType,
            elementId: this.elementId,
        });
    }

    public letElementArrive() {
        this.exerciseService.proposeAction({
            type: '[Transfer] Finish transfer',
            elementType: this.elementType,
            elementId: this.elementId,
            targetTransferPointId: this.transfer.targetTransferPointId,
        });
    }
}
