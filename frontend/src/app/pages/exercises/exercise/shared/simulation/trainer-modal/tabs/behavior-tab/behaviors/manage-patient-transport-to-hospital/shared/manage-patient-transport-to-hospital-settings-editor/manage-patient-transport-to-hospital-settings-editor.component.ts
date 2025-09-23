import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ManagePatientTransportToHospitalBehaviorState } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { createSelectBehaviorState } from 'src/app/state/application/selectors/exercise.selectors';

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
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

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
