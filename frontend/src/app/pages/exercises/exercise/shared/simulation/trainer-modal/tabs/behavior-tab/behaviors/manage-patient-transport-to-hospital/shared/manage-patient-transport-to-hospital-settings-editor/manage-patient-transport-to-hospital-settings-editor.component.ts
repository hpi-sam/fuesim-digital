import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from '../../../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../../../state/app.state';
import { createSelectBehaviorState } from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-settings-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-settings-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-settings-editor.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalSettingsEditorComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId,
                this.behaviorId
            )
        );
    }

    updateRequestVehicleDelay(requestVehicleDelay: number) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Update Request Vehicle Delay For Patient Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            requestVehicleDelay,
        });
    }

    updateRequestPatientCountDelay(requestPatientCountDelay: number) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Update Request Patient Count Delay For Patient Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            requestPatientCountDelay,
        });
    }

    updatePromiseInvalidationInterval(promiseInvalidationInterval: number) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Update Promise Invalidation Interval For Patient Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            promiseInvalidationInterval,
        });
    }
}
