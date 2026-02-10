import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { createSelectBehaviorState } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-status-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-status-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-status-editor.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalStatusEditorComponent
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

    startTransport() {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Start Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
        });
    }

    stopTransport() {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Stop Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
        });
    }
}
