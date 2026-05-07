import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../../../../state/app.state';
import { createSelectBehaviorState } from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';
import { ExerciseService } from '../../../../../../../../../../../../core/exercise.service';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-status-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-status-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-status-editor.component.scss',
    ],
    imports: [AsyncPipe],
})
export class ManagePatientTransportToHospitalStatusEditorComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
            )
        );
    }

    startTransport() {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Start Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
        });
    }

    stopTransport() {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Stop Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
        });
    }
}
