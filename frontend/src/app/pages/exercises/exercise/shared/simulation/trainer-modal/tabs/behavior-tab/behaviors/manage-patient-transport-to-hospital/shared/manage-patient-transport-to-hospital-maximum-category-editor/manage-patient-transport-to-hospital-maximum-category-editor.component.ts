import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../../../state/app.state';
import { createSelectBehaviorState } from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';
import { PatientStatusBadgeComponent } from '../../../../../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector:
        'app-manage-patient-transport-to-hospital-maximum-category-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-maximum-category-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-maximum-category-editor.component.scss',
    ],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        PatientStatusBadgeComponent,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
    ],
})
export class ManagePatientTransportToHospitalMaximumCategoryEditorComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    public patientStatusForTransport = ['red', 'yellow', 'green'] as const;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            maximumCategoryToTransport,
        });
    }
}
