import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Transfer } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectTransferPoints } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-target-input',
    templateUrl: './transfer-target-input.component.html',
    styleUrls: ['./transfer-target-input.component.scss'],
    standalone: false,
})
export class TransferTargetInputComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input() elementType!: 'personnel' | 'vehicle';
    @Input() elementId!: UUID;
    @Input() transfer!: Transfer;

    public readonly transferPoints$ = this.store.select(selectTransferPoints);

    public setTransferTarget(targetTransferPointId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Transfer] Edit transfer',
            elementType: this.elementType,
            elementId: this.elementId,
            targetTransferPointId,
        });
    }
}
