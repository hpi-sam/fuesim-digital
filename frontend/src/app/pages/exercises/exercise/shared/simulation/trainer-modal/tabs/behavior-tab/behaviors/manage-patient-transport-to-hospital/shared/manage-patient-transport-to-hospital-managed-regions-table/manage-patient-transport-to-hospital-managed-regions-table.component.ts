import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    SimulatedRegion,
    PatientStatus,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
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
    selectSimulatedRegions,
    selectConfiguration,
} from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';
import { PatientStatusBadgeComponent } from '../../../../../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import { AppSaveOnTypingDirective } from '../../../../../../../../../../../../shared/directives/app-save-on-typing.directive';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-managed-regions-table',
    templateUrl:
        './manage-patient-transport-to-hospital-managed-regions-table.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-managed-regions-table.component.scss',
    ],
    imports: [
        PatientStatusBadgeComponent,
        FormsModule,
        AppSaveOnTypingDirective,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
    ],
})
export class ManagePatientTransportToHospitalManagedRegionsTableComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;
    public managedSimulatedRegions$!: Observable<SimulatedRegion[]>;
    public patientStatusOptions$!: Observable<PatientStatus[]>;
    public possibleNewSimulatedRegionsToManage$!: Observable<SimulatedRegion[]>;

    public selectedSimulatedRegionId?: UUID;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            managedSimulatedRegionId,
        });
    }

    removeSimulatedRegionToManage(managedSimulatedRegionId: UUID) {
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            managedSimulatedRegionId,
            patientsExpected,
            patientStatus,
        });
    }
}
