import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Transfer } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import { selectTransferPoints } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-transfer-target-input',
    templateUrl: './transfer-target-input.component.html',
    styleUrls: ['./transfer-target-input.component.scss'],
    standalone: false,
})
export class TransferTargetInputComponent {
    @Input() elementType!: 'personnel' | 'vehicle';
    @Input() elementId!: UUID;
    @Input() transfer!: Transfer;

    public readonly transferPoints$ = this.store.select(selectTransferPoints);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    public setTransferTarget(targetTransferPointId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Transfer] Edit transfer',
            elementType: this.elementType,
            elementId: this.elementId,
            targetTransferPointId,
        });
    }
}
