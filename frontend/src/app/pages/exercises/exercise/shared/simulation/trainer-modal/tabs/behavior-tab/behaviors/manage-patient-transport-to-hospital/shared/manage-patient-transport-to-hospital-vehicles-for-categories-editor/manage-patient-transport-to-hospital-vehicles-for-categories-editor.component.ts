import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    PatientStatusForTransport,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
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
import {
    createSelectBehaviorState,
    selectVehicleTemplates,
} from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';
import { PatientStatusBadgeComponent } from '../../../../../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector:
        'app-manage-patient-transport-to-hospital-vehicles-for-categories-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-vehicles-for-categories-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-vehicles-for-categories-editor.component.scss',
    ],
    imports: [
        PatientStatusBadgeComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
    ],
})
export class ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    public possibleNewVehicleTypesForTransport$!: Observable<{
        [key in PatientStatusForTransport]: string[];
    }>;

    public patientStatusForTransport = ['red', 'yellow', 'green'] as const;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
            )
        );

        const vehicleTypes$ = this.store
            .select(selectVehicleTemplates)
            .pipe(
                map((vehicleTemplates) =>
                    Object.values(vehicleTemplates).map(
                        (vehicleTemplate) => vehicleTemplate.vehicleType
                    )
                )
            );

        this.possibleNewVehicleTypesForTransport$ = combineLatest([
            this.behaviorState$,
            vehicleTypes$,
        ]).pipe(
            map(
                ([behaviorState, vehicleTypes]) =>
                    Object.fromEntries(
                        this.patientStatusForTransport.map(
                            (patientStatusForTransport) => [
                                patientStatusForTransport,
                                vehicleTypes.filter(
                                    (vehicleType) =>
                                        !behaviorState.vehiclesForPatients[
                                            patientStatusForTransport
                                        ].includes(vehicleType)
                                ),
                            ]
                        )
                    ) as { [key in PatientStatusForTransport]: string[] }
            )
        );
    }

    addVehicleTypeForPatientTransport(
        vehicleTypeName: string,
        patientStatus: PatientStatusForTransport
    ) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Add Vehicle Type For Patient Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            vehicleTypeName,
            patientStatus,
        });
    }

    removeVehicleTypeForPatientTransport(
        vehicleTypeName: string,
        patientStatus: PatientStatusForTransport
    ) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Remove Vehicle Type For Patient Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            vehicleTypeName,
            patientStatus,
        });
    }
}
