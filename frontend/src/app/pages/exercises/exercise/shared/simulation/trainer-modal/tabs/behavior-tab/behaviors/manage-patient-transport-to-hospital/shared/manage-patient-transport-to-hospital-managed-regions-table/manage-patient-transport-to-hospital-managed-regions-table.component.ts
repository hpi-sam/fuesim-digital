import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    SimulatedRegion,
    PatientStatus,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    selectConfiguration,
    selectSimulatedRegions,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-managed-regions-table',
    templateUrl:
        './manage-patient-transport-to-hospital-managed-regions-table.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-managed-regions-table.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalManagedRegionsTableComponent
    implements OnChanges
{
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;
    public managedSimulatedRegions$!: Observable<SimulatedRegion[]>;
    public patientStatusOptions$!: Observable<PatientStatus[]>;
    public possibleNewSimulatedRegionsToManage$!: Observable<SimulatedRegion[]>;

    public selectedSimulatedRegionId?: UUID;

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

        const simulatedRegions$ = this.store.select(selectSimulatedRegions);

        this.managedSimulatedRegions$ = combineLatest([
            this.behaviorState$,
            simulatedRegions$,
        ]).pipe(
            map(([behaviorState, simulatedRegions]) =>
                Object.keys(behaviorState.simulatedRegionsToManage).map(
                    (simulatedRegionId) => simulatedRegions[simulatedRegionId]!
                )
            )
        );

        const configuration$ = this.store.select(selectConfiguration);

        this.patientStatusOptions$ = configuration$.pipe(
            map((configuration) => {
                if (configuration.bluePatientsEnabled) {
                    return ['red', 'yellow', 'green', 'blue', 'black', 'white'];
                }
                return ['red', 'yellow', 'green', 'black', 'white'];
            })
        );

        this.possibleNewSimulatedRegionsToManage$ = combineLatest([
            this.behaviorState$,
            simulatedRegions$,
        ]).pipe(
            map(([behaviorState, simulatedRegions]) =>
                Object.values(simulatedRegions).filter(
                    (simulatedRegion) =>
                        !behaviorState.simulatedRegionsToManage[
                            simulatedRegion.id
                        ]
                )
            )
        );
    }

    selectRegion(simulatedRegionId: UUID) {
        this.selectedSimulatedRegionId = simulatedRegionId;
    }

    unselectRegion() {
        this.selectedSimulatedRegionId = undefined;
    }

    addSimulatedRegionToManage(managedSimulatedRegionId: UUID) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Add Simulated Region To Manage For Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            managedSimulatedRegionId,
        });
    }

    removeSimulatedRegionToManage(managedSimulatedRegionId: UUID) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            managedSimulatedRegionId,
        });
    }

    updatePatientsExpectedInRegion(
        managedSimulatedRegionId: UUID,
        patientsExpected: number,
        patientStatus: PatientStatus
    ) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Update Patients Expected In Region For Transport',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            managedSimulatedRegionId,
            patientsExpected,
            patientStatus,
        });
    }
}
