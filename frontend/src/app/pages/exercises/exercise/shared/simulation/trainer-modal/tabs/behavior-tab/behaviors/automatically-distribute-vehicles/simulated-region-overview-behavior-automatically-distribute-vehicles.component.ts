import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    UUID,
    AutomaticallyDistributeVehiclesBehaviorState,
} from 'fuesim-digital-shared';
import {
    getTransferPointFullName,
    isInSpecificSimulatedRegion,
    TransferPoint,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    selectVehicleTemplates,
    selectTransferPoints,
} from '../../../../../../../../../../state/application/selectors/exercise.selectors';
import { AppSaveOnTypingDirective } from '../../../../../../../../../../shared/directives/app-save-on-typing.directive';
import { TransferPointNameComponent } from '../../../../../../../../../../shared/components/transfer-point-name/transfer-point-name.component';
import { ValuesPipe } from '../../../../../../../../../../shared/pipes/values.pipe';
import { OrderByPipe } from '../../../../../../../../../../shared/pipes/order-by.pipe';

@Component({
    selector:
        'app-simulated-region-overview-behavior-automatically-distribute-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-automatically-distribute-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-automatically-distribute-vehicles.component.scss',
    ],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        FormsModule,
        AppSaveOnTypingDirective,
        TransferPointNameComponent,
        ValuesPipe,
        OrderByPipe,
        AsyncPipe,
    ],
})
export class SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent
    implements OnInit
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();
    readonly automaticallyDistributeVehiclesBehaviorId = input.required<UUID>();

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
        getTransferPointFullName(transferPoint);

    public readonly infinity = Number.MAX_VALUE;

    ngOnInit(): void {
        const automaticallyDistributeVehiclesBehaviorStateSelector =
            createSelectBehaviorState<AutomaticallyDistributeVehiclesBehaviorState>(
                this.simulatedRegionId(),
                this.automaticallyDistributeVehiclesBehaviorId()
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
                Object.values(vehicleTemplates)
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
                        this.simulatedRegionId()
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            vehicleType,
            newLimit: 1,
        });
    }

    public removeVehicle(vehicleType: string) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            vehicleType,
            newLimit: 0,
        });
    }

    public changeLimitOfVehicle(vehicleType: string, newLimit: number) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            vehicleType,
            newLimit,
        });
    }

    public unlimitedLimitOfVehicle(vehicleType: string) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Change Limit',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            vehicleType,
            newLimit: currentlyDistributed,
        });
    }

    public addDistributionDestination(destinationId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Add Destination',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            destinationId,
        });
    }

    public removeDistributionDestination(destinationId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AutomaticDistributionBehavior] Remove Destination',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.automaticallyDistributeVehiclesBehaviorId(),
            destinationId,
        });
    }
}
