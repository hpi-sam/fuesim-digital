import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    PatientStatusForTransport,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { StrictObject } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector:
        'app-manage-patient-transport-to-hospital-vehicles-for-categories-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-vehicles-for-categories-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-vehicles-for-categories-editor.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent
    implements OnChanges
{
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;

    public possibleNewVehicleTypesForTransport$!: Observable<{
        [key in PatientStatusForTransport]: string[];
    }>;

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

        const vehicleTypes$ = this.store
            .select(selectVehicleTemplates)
            .pipe(
                map((vehicleTemplates) =>
                    vehicleTemplates.map(
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
                    StrictObject.fromEntries(
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
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
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
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            vehicleTypeName,
            patientStatus,
        });
    }
}
