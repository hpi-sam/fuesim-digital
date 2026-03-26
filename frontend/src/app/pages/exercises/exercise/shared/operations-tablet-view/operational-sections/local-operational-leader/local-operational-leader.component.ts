import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectLocalOperationsCommand,
    selectVehiclesInTransferFromAlarmgroup,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { SectionLeaderSlotComponent } from '../section-leader-slot/section-leader-slot.component';
import { OperationsVehicleItemComponent } from '../../operation-details/operations-vehicles/operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-local-operational-leader',
    templateUrl: './local-operational-leader.component.html',
    styleUrl: './local-operational-leader.component.scss',
    imports: [SectionLeaderSlotComponent, OperationsVehicleItemComponent],
})
export class LocalOperationalLeaderComponent {
    private readonly store = inject(Store<AppState>);
    private readonly exerciseService = inject(ExerciseService);

    public readonly localSectionLeader = this.store.selectSignal(
        selectLocalOperationsCommand
    );

    public onVehicleAssigned(vehicleId: string) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Assign Local Operations Command',
                vehicleId,
            },
            true
        );
    }

    public vehiclesFromAlarmgroups = this.store.selectSignal(
        selectVehiclesInTransferFromAlarmgroup
    );
}
