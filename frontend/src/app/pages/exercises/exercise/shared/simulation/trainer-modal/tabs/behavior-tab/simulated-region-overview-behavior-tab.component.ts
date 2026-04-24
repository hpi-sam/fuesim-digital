import type { OnChanges, OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseSimulationBehaviorState,
    ExerciseSimulationBehaviorType,
} from 'fuesim-digital-shared';
import {
    simulationBehaviorDictionary,
    TypeAssertedObject,
    SimulatedRegion,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import type { TransferOptions } from '../../start-transfer.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    createSelectBehaviorStates,
    selectVehicleTemplates,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../state/get-state-snapshot';
import { SimulatedRegionOverviewBehaviorAssignLeaderComponent } from './behaviors/assign-leader/simulated-region-overview-behavior-assign-leader.component';
import { SimulatedRegionOverviewBehaviorTreatPatientsComponent } from './behaviors/treat-patients/simulated-region-overview-behavior-treat-patients.component';
import { SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent } from './behaviors/unload-arriving-vehicles/simulated-region-overview-behavior-unload-arriving-vehicles.component';
import { SimulatedRegionOverviewBehaviorReportComponent } from './behaviors/report/simulated-region-overview-behavior-report.component';
import { SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent } from './behaviors/automatically-distribute-vehicles/simulated-region-overview-behavior-automatically-distribute-vehicles.component';
import { SimulatedRegionOverviewBehaviorProvidePersonnelComponent } from './behaviors/provide-personnel/simulated-region-overview-behavior-provide-personnel.component';
import { SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent } from './behaviors/answer-vehicle-requests/simulated-region-overview-behavior-answer-vehicle-requests.component';
import { RequestVehiclesComponent } from './behaviors/request-vehicles/simulated-region-overview-behavior-request-vehicles.component';
import { SimulatedRegionOverviewBehaviorTransferVehiclesComponent } from './behaviors/transfer-vehicles/simulated-region-overview-behavior-transfer-vehicles.component';
import { SimulatedRegionOverviewBehaviorTransferToHospitalComponent } from './behaviors/transfer-to-hospital/simulated-region-overview-behavior-transfer-to-hospital.component';
import { SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent } from './behaviors/manage-patient-transport-to-hospital/simulated-region-overview-behavior-manage-patient-transport-to-hospital.component';
import { BehaviorTypeToGermanNamePipe } from './utils/behavior-to-german-name.pipe';

let globalLastBehaviorType: ExerciseSimulationBehaviorType | undefined;

@Component({
    selector: 'app-simulated-region-overview-behavior-tab',
    templateUrl: './simulated-region-overview-behavior-tab.component.html',
    styleUrls: ['./simulated-region-overview-behavior-tab.component.scss'],
    imports: [
        SimulatedRegionOverviewBehaviorAssignLeaderComponent,
        SimulatedRegionOverviewBehaviorTreatPatientsComponent,
        SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent,
        SimulatedRegionOverviewBehaviorReportComponent,
        SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent,
        SimulatedRegionOverviewBehaviorProvidePersonnelComponent,
        SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent,
        RequestVehiclesComponent,
        SimulatedRegionOverviewBehaviorTransferVehiclesComponent,
        SimulatedRegionOverviewBehaviorTransferToHospitalComponent,
        SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
        BehaviorTypeToGermanNamePipe,
    ],
})
export class SimulatedRegionOverviewBehaviorTabComponent
    implements OnChanges, OnInit
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegion = input.required<SimulatedRegion>();
    readonly initialTransferOptions = input<TransferOptions>();

    public behaviorTypesToBeAdded$!: Observable<
        ExerciseSimulationBehaviorType[]
    >;
    public selectedBehavior?: ExerciseSimulationBehaviorState;

    async ngOnInit() {
        if (globalLastBehaviorType !== undefined) {
            this.selectedBehavior = this.simulatedRegion().behaviors.find(
                (behavior) => behavior.type === globalLastBehaviorType
            );
        }
        if (this.initialTransferOptions()) {
            this.selectedBehavior = this.simulatedRegion().behaviors.find(
                (behavior) => behavior.type === 'transferBehavior'
            );
            if (!this.selectedBehavior) {
                await this.exerciseService.proposeAction({
                    type: '[SimulatedRegion] Add Behavior',
                    simulatedRegionId: this.simulatedRegion().id,
                    behaviorState:
                        simulationBehaviorDictionary.transferBehavior.newBehaviorState(),
                });
                this.selectedBehavior = this.simulatedRegion().behaviors.find(
                    (behavior) => behavior.type === 'transferBehavior'
                );
            }
        }

        this.behaviorTypesToBeAdded$ = this.store
            .select(createSelectBehaviorStates(this.simulatedRegion().id))
            .pipe(
                map((states) => {
                    const currentTypes = new Set(
                        states.map((state) => state.type)
                    );
                    return TypeAssertedObject.keys(
                        simulationBehaviorDictionary
                    ).filter((type) => !currentTypes.has(type));
                })
            );
    }

    public ngOnChanges() {
        const simulatedRegion = this.simulatedRegion();
        if (
            // if the selected behavior has been removed by a different client
            this.selectedBehavior !== undefined &&
            !simulatedRegion.behaviors.includes(this.selectedBehavior)
        ) {
            this.selectedBehavior = simulatedRegion.behaviors.find(
                (behavior) => behavior.id === this.selectedBehavior?.id
            );
        }
    }

    public addBehavior(behaviorType: ExerciseSimulationBehaviorType) {
        const args: any[] = [];
        switch (behaviorType) {
            case 'providePersonnelBehavior':
                args.push(
                    Object.values(
                        selectStateSnapshot(selectVehicleTemplates, this.store)
                    ).map((template) => template.id)
                );
                break;
            default:
                break;
        }
        const behaviorState = simulationBehaviorDictionary[
            behaviorType
        ].newBehaviorState(...args);
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Add Behavior',
            simulatedRegionId: this.simulatedRegion().id,
            behaviorState,
        });
    }

    public removeSelectedBehavior() {
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Remove Behavior',
            simulatedRegionId: this.simulatedRegion().id,
            behaviorId: this.selectedBehavior!.id,
        });
        this.selectedBehavior = undefined;
    }

    public onBehaviorSelect(behavior: ExerciseSimulationBehaviorState): void {
        this.selectedBehavior = behavior;
        globalLastBehaviorType = behavior.type;
    }
}
