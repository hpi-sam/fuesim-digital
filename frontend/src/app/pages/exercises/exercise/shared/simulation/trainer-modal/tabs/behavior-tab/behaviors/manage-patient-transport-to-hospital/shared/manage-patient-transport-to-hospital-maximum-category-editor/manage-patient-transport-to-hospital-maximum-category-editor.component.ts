import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectBehaviorState } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector:
        'app-manage-patient-transport-to-hospital-maximum-category-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-maximum-category-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-maximum-category-editor.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalMaximumCategoryEditorComponent
    implements OnChanges
{
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    public patientStatusForTransport = ['red', 'yellow', 'green'] as const;

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

    updateMaximumCategoryToTransport(maximumCategoryToTransport: string) {
        if (
            maximumCategoryToTransport !== 'red' &&
            maximumCategoryToTransport !== 'yellow' &&
            maximumCategoryToTransport !== 'green'
        ) {
            throw new Error('Invalid maximum category to transport');
        }
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            maximumCategoryToTransport,
        });
    }
}
