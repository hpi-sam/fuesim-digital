import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Transfer } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { selectCurrentTime } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-time-input',
    templateUrl: './transfer-time-input.component.html',
    styleUrls: ['./transfer-time-input.component.scss'],
    standalone: false,
})
export class TransferTimeInputComponent {
    @Input() elementType!: 'personnel' | 'vehicle';

    @Input() elementId!: UUID;

    @Input() transfer!: Transfer;

    public readonly currentTime$ = this.store.select(selectCurrentTime);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

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
