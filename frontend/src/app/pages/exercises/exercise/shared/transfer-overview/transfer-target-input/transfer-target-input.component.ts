import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Transfer } from 'fuesim-digital-shared';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectTransferPoints } from '../../../../../../state/application/selectors/exercise.selectors';
import { TransferPointNameComponent } from '../../../../../../shared/components/transfer-point-name/transfer-point-name.component';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-transfer-target-input',
    templateUrl: './transfer-target-input.component.html',
    styleUrls: ['./transfer-target-input.component.scss'],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        TransferPointNameComponent,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
        ValuesPipe,
    ],
})
export class TransferTargetInputComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly elementType = input.required<'personnel' | 'vehicle'>();
    readonly elementId = input.required<UUID>();
    readonly transfer = input.required<Transfer>();

    public readonly transferPoints$ = this.store.select(selectTransferPoints);

    public setTransferTarget(targetTransferPointId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Transfer] Edit transfer',
            elementType: this.elementType(),
            elementId: this.elementId(),
            targetTransferPointId,
        });
    }
}
