import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import {
    isInSpecificSimulatedRegion,
    TransferPoint,
} from 'digital-fuesim-manv-shared';
import type { AutomaticallyDistributeVehiclesBehaviorState } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    selectTransferPoints,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector:
        'app-simulated-region-overview-behavior-automatically-distribute-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-automatically-distribute-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-automatically-distribute-vehicles.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent
    implements OnInit
{
    @Input() simulatedRegionId!: UUID;
    @Input() automaticallyDistributeVehiclesBehaviorId!: UUID;

    public automaticallyDistributeVehiclesBehaviorState$!: Observable<AutomaticallyDistributeVehiclesBehaviorState>;
    public distributionLimits$!: Observable<
        { vehicleType: string; vehicleAmount: number }[]
    >;
    public distributionDestinations$!: Observable<
        { name: string; id: string }[]
    >;

    public addableVehicleTypes$!: Observable<string[]>;
    public addableTransferPoints$!: Observable<{
        [k: string]: TransferPoint;
    }>;
    public getTransferPointOrderByValue = (transferPoint: TransferPoint) =>
        TransferPoint.getFullName(transferPoint);

    public readonly infinity = Number.MAX_VALUE;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    ngOnInit(): void {
        const automaticallyDistributeVehiclesBehaviorStateSelector =
            createSelectBehaviorState<AutomaticallyDistributeVehiclesBehaviorState>(
                this.simulatedRegionId,
                this.automaticallyDistributeVehiclesBehaviorId
            );

        const distributionLimitsSelector = createSelector(
            automaticallyDistributeVehiclesBehaviorStateSelector,
            (automaticallyDistributeVehiclesBehaviorState) =>
                Object.entries(
                    automaticallyDistributeVehiclesBehaviorState.distributionLimits
                )
                    .filter(
                        ([_vehicleType, vehicleAmount]) => vehicleAmount > 0
                    )
                    .map(([vehicleType, vehicleAmount]) => ({
                        vehicleType,
                        vehicleAmount,
                    }))
        );

        const presentDistributionDestinationsSelector = createSelector(
            automaticallyDistributeVehiclesBehaviorStateSelector,
            (automaticallyDistributeVehiclesBehaviorState) =>
                automaticallyDistributeVehiclesBehaviorState.distributionDestinations
        );

        const presentVehicleTypesSelector = createSelector(
            distributionLimitsSelector,
            (distributionLimits) =>
                distributionLimits.map(
                    (distributionLimit) => distributionLimit.vehicleType
                )
        );

        const addableVehicleTypesSelector = createSelector(
            selectVehicleTemplates,
            presentVehicleTypesSelector,
            (vehicleTemplates, presentVehicleTypes) =>
                vehicleTemplates
                    .map((vehicleTemplate) => vehicleTemplate.vehicleType)
                    .filter(
                        (vehicleType) =>
                            !presentVehicleTypes.includes(vehicleType)
                    )
        );

        const distributionDestinationsSelector = createSelector(
            presentDistributionDestinationsSelector,
            selectTransferPoints,
            (presentDestinations, transferPoints) =>
                Object.keys(presentDestinations).map((destinationId) => ({
                    name: transferPoints[destinationId]!.externalName,
                    id: destinationId,
                }))
        );

        const ownTransferPointSelector = createSelector(
            selectTransferPoints,
            (transferPoints) =>
                Object.values(transferPoints).find((transferPoint) =>
                    isInSpecificSimulatedRegion(
                        transferPoint,
                        this.simulatedRegionId
                    )
                )!
        );

        const addableTransferPointsSelector = createSelector(
            selectTransferPoints,
            ownTransferPointSelector,
            presentDistributionDestinationsSelector,
            (
                transferPoints,
                ownTransferPoint,
                presentDistributionDestinations
            ) =>
                Object.fromEntries(
                    Object.entries(transferPoints).filter(
                        ([key]) =>
                            key !== ownTransferPoint.id &&
                            !presentDistributionDestinations[key]
                    )
                )
        );

        this.addableVehicleTypes$ = this.store.select(
            addableVehicleTypesSelector
        );

        this.automaticallyDistributeVehiclesBehaviorState$ = this.store.select(
            automaticallyDistributeVehiclesBehaviorStateSelector
        );

        this.addableTransferPoints$ = this.store.select(
            addableTransferPointsSelector
        );

        this.distributionLimits$ = this.store.select(
            distributionLimitsSelector
        );

        this.distributionDestinations$ = this.store.select(
            distributionDestinationsSelector
        );
    }

    public addVehicle(vehicleType: string) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            vehicleType,
            newLimit: 1,
        });
    }

    public removeVehicle(vehicleType: string) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            vehicleType,
            newLimit: 0,
        });
    }

    public changeLimitOfVehicle(vehicleType: string, newLimit: number) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            vehicleType,
            newLimit,
        });
    }

    public unlimitedLimitOfVehicle(vehicleType: string) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            vehicleType,
            newLimit: this.infinity,
        });
    }

    public limitedLimitOfVehicle(
        vehicleType: string,
        currentlyDistributed: number
    ) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            vehicleType,
            newLimit: currentlyDistributed,
        });
    }

    public addDistributionDestination(destinationId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Add Destination',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            destinationId,
        });
    }

    public removeDistributionDestination(destinationId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Remove Destination',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId,
            destinationId,
        });
    }
}
