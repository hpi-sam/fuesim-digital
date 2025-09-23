import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import type { MemoizedSelector } from '@ngrx/store';
import { Store, createSelector } from '@ngrx/store';
import type {
    Hospital,
    PatientStatus,
    TransferBehaviorState,
    TransferPoint,
    UUIDSet,
    Vehicle,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import {
    cloneDeepMutable,
    isInSpecificVehicle,
    isInSpecificSimulatedRegion,
    Patient,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { Subject, takeUntil } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectActivityStatesByType,
    createSelectBehaviorState,
    createSelectElementsInSimulatedRegion,
    selectConfiguration,
    selectCurrentTime,
    selectHospitals,
    selectPatients,
    selectTransferPoints,
    selectVehicles,
} from 'src/app/state/application/selectors/exercise.selectors';
import { comparePatientsByVisibleStatus } from '../../../compare-patients';
import type { TransferOptions } from '../../../../start-transfer.service';

let globalLastInformationCollapsed = true;
let globalLastSettingsCollapsed = true;
let globalLastTransferCollapsed = true;

@Component({
    selector: 'app-simulated-region-overview-behavior-transfer-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-transfer-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-transfer-vehicles.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorTransferVehiclesComponent
    implements OnInit, OnDestroy
{
    @Input() simulatedRegionId!: UUID;
    @Input() transferBehaviorId!: UUID;
    @Input() initialTransferOptions?: TransferOptions;

    private readonly destroy$ = new Subject<void>();
    private readonly destroyPatients$ = new Subject<void>();

    public minPatients = 0;

    public selectedPatients: { [key: UUID]: boolean } = {};

    public bufferedTransfers$!: Observable<
        { vehicleName: string; destination: string; numberOfPatients: number }[]
    >;
    public bufferDelay$!: Observable<number>;
    public activeActivities$!: Observable<
        {
            vehicleName: string;
            destination: string;
            numberOfPatients: number;
            remainingTime: number;
        }[]
    >;

    private _selectedVehicle?: Vehicle | undefined;
    public get selectedVehicle(): Vehicle | undefined {
        return this._selectedVehicle;
    }
    public set selectedVehicle(value: Vehicle | undefined) {
        this._selectedVehicle = value;
        this.updatePatientSelection();
    }

    public useableVehicles$!: Observable<Vehicle[]>;

    public reachableTransferPoints$!: Observable<TransferPoint[]>;
    public reachableHospitals$!: Observable<Hospital[]>;

    public selectedDestination?: {
        name?: string | undefined;
        externalName?: string | undefined;
    } & (Hospital | TransferPoint);

    private _informationCollapsed: boolean;
    transferBehaviorState$!: Observable<TransferBehaviorState>;
    patients$!: Observable<
        (Patient & {
            visibleStatus: PatientStatus;
        })[]
    >;

    public get informationCollapsed(): boolean {
        return this._informationCollapsed;
    }
    public set informationCollapsed(value: boolean) {
        this._informationCollapsed = value;
        globalLastInformationCollapsed = value;
    }

    private _settingsCollapsed: boolean;

    public get settingsCollapsed(): boolean {
        return this._settingsCollapsed;
    }
    public set settingsCollapsed(value: boolean) {
        this._settingsCollapsed = value;
        globalLastSettingsCollapsed = value;
    }

    private _transferCollapsed: boolean;

    public get transferCollapsed(): boolean {
        return this._transferCollapsed;
    }
    public set transferCollapsed(value: boolean) {
        this._transferCollapsed = value;
        globalLastTransferCollapsed = value;
    }

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {
        this._informationCollapsed = globalLastInformationCollapsed;
        this._settingsCollapsed = globalLastSettingsCollapsed;
        this._transferCollapsed = globalLastTransferCollapsed;
    }

    ngOnInit(): void {
        if (this.initialTransferOptions) {
            this.transferCollapsed = false;
            this.selectedVehicle =
                this.initialTransferOptions.vehicleToTransfer;
            this.selectedDestination =
                this.initialTransferOptions.transferDestination;
            this.selectedPatients =
                cloneDeepMutable(
                    this.initialTransferOptions.patientsToTransfer
                ) ?? {};
            this.minPatients = Object.values(this.selectedPatients).filter(
                (clicked) => clicked
            ).length;
        }

        const transferBehaviorStateSelector: MemoizedSelector<
            AppState,
            TransferBehaviorState
        > = createSelectBehaviorState(
            this.simulatedRegionId,
            this.transferBehaviorId
        );

        const bufferedTransferEventQueueSelector = createSelector(
            transferBehaviorStateSelector,
            (transferBehaviorState) =>
                transferBehaviorState.startTransferEventQueue
        );

        const bufferedTransfersSelector = createSelector(
            bufferedTransferEventQueueSelector,
            selectVehicles,
            selectHospitals,
            selectTransferPoints,
            (bufferedTransferEventQueue, vehicles, hospitals, transferPoints) =>
                bufferedTransferEventQueue.map((bufferedTransferEvent) => ({
                    vehicleName:
                        vehicles[bufferedTransferEvent.vehicleId]?.name ??
                        'Gelöschtes Fahrzeug',
                    destination:
                        bufferedTransferEvent.transferDestinationType ===
                        'hospital'
                            ? (hospitals[
                                  bufferedTransferEvent.transferDestinationId
                              ]?.name ?? 'Gelöschtes Krankenhaus')
                            : (transferPoints[
                                  bufferedTransferEvent.transferDestinationId
                              ]?.externalName ?? 'Gelöschtes Transferziel'),
                    numberOfPatients: Object.keys(
                        vehicles[bufferedTransferEvent.vehicleId]?.patientIds ??
                            {}
                    ).length,
                }))
        );

        const activeRecurringEventActivityStatesSelector =
            createSelectActivityStatesByType(
                this.simulatedRegionId,
                'recurringEventActivity'
            );

        const bufferDelaySelector = createSelector(
            transferBehaviorStateSelector,
            activeRecurringEventActivityStatesSelector,
            selectCurrentTime,
            (
                transferBehaviorState,
                activeRecurringEventActivityStates,
                currentTime
            ) => {
                if (transferBehaviorState.recurringActivityId) {
                    const recurringEventActivity =
                        activeRecurringEventActivityStates.find(
                            (activity) =>
                                activity.id ===
                                transferBehaviorState.recurringActivityId
                        );

                    if (recurringEventActivity) {
                        return (
                            recurringEventActivity.lastOccurrenceTime +
                            recurringEventActivity.recurrenceIntervalTime -
                            currentTime
                        );
                    }
                }

                return 0;
            }
        );

        const activeActivityStatesSelector = createSelectActivityStatesByType(
            this.simulatedRegionId,
            'loadVehicleActivity'
        );

        const activeActivitiesSelector = createSelector(
            activeActivityStatesSelector,
            selectVehicles,
            selectHospitals,
            selectTransferPoints,
            selectCurrentTime,
            (
                activeActivityStates,
                vehicles,
                hospitals,
                transferPoints,
                currentTime
            ) =>
                activeActivityStates.map((activeActivityState) => ({
                    vehicleName:
                        vehicles[activeActivityState.vehicleId]?.name ??
                        'Gelöschtes Fahrzeug',
                    destination:
                        activeActivityState.transferDestinationType ===
                        'hospital'
                            ? (hospitals[
                                  activeActivityState.transferDestinationId
                              ]?.name ?? 'Gelöschtes Krankenhaus')
                            : (transferPoints[
                                  activeActivityState.transferDestinationId
                              ]?.externalName ?? 'Gelöschtes Transferziel'),
                    numberOfPatients: Object.keys(
                        activeActivityState.patientsToBeLoaded
                    ).length,
                    remainingTime:
                        activeActivityState.startTime +
                        (activeActivityState.loadDelay ?? 0) -
                        currentTime,
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

        const vehiclesInSimulatedRegionSelector =
            createSelectElementsInSimulatedRegion(
                selectVehicles,
                this.simulatedRegionId
            );

        const reachableTransferPointsSelector = createSelector(
            selectTransferPoints,
            ownTransferPointSelector,
            (transferPoints, transferPoint) =>
                Object.keys(transferPoint.reachableTransferPoints).map(
                    (id) => transferPoints[id]!
                )
        );

        const reachableHospitalsSelector = createSelector(
            selectHospitals,
            Object.values
        );

        this.bufferedTransfers$ = this.store.select(bufferedTransfersSelector);
        this.bufferDelay$ = this.store.select(bufferDelaySelector);
        this.activeActivities$ = this.store.select(activeActivitiesSelector);
        this.transferBehaviorState$ = this.store.select(
            transferBehaviorStateSelector
        );
        this.useableVehicles$ = this.store.select(
            vehiclesInSimulatedRegionSelector
        );

        this.reachableTransferPoints$ = this.store.select(
            reachableTransferPointsSelector
        );
        this.reachableHospitals$ = this.store.select(
            reachableHospitalsSelector
        );

        this.updatePatientSelection();

        // remove selected elements if deleted

        this.useableVehicles$
            .pipe(takeUntil(this.destroy$))
            .subscribe((useableVehicles) => {
                if (
                    this.selectedVehicle &&
                    !useableVehicles.includes(this.selectedVehicle)
                ) {
                    this.selectedVehicle = undefined;
                }
            });

        this.reachableHospitals$
            .pipe(takeUntil(this.destroy$))
            .subscribe((reachableHospitals) => {
                if (
                    this.selectedDestination?.type === 'hospital' &&
                    !reachableHospitals.includes(this.selectedDestination)
                ) {
                    this.selectedDestination = undefined;
                }
            });

        this.reachableTransferPoints$
            .pipe(takeUntil(this.destroy$))
            .subscribe((reachableTransferPoints) => {
                if (
                    this.selectedDestination?.type === 'transferPoint' &&
                    !reachableTransferPoints.includes(this.selectedDestination)
                ) {
                    this.selectedDestination = undefined;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroyPatients$.next();
    }

    public updatePatientLoadTime(loadTimePerPatient: number) {
        this.exerciseService.proposeAction({
            type: '[TransferBehavior] Update Patient Load Time',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.transferBehaviorId,
            loadTimePerPatient,
        });
    }
    public updatePersonnelLoadTime(personnelLoadTime: number) {
        this.exerciseService.proposeAction({
            type: '[TransferBehavior] Update Personnel Load Time',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.transferBehaviorId,
            personnelLoadTime,
        });
    }
    public updateSendDelay(delayBetweenSends: number) {
        this.exerciseService.proposeAction({
            type: '[TransferBehavior] Update Delay Between Sends',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.transferBehaviorId,
            delayBetweenSends,
        });
    }

    public togglePatientSelection(patient: Patient) {
        if (
            !this.selectedPatients[patient.id] &&
            this.minPatients + 1 >
                (this.selectedVehicle?.patientCapacity ??
                    Number.POSITIVE_INFINITY)
        ) {
            return;
        }

        this.selectedPatients[patient.id] = !this.selectedPatients[patient.id];
        this.minPatients = Object.values(this.selectedPatients).filter(
            (clicked) => clicked
        ).length;
    }

    public sendVehicle() {
        if (!this.selectedVehicle || !this.selectedDestination) {
            return;
        }

        const patients: UUIDSet = Object.fromEntries(
            Object.entries(this.selectedPatients)
                .filter(([_patientId, clicked]) => clicked)
                .map(([patientId, _clicked]) => [patientId, true])
        );

        this.exerciseService.proposeAction({
            type: '[TransferBehavior] Send Transfer Request Event',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.transferBehaviorId,
            vehicleId: this.selectedVehicle.id,
            destinationType: this.selectedDestination.type,
            destinationId: this.selectedDestination.id,
            patients,
        });

        this.selectedPatients = {};
        this.selectedVehicle = undefined;
        this.minPatients = 0;
    }

    private updatePatientSelection() {
        this.destroyPatients$.next();

        const patientsInSimulatedRegionSelector =
            createSelectElementsInSimulatedRegion(
                selectPatients,
                this.simulatedRegionId
            );

        const patientsInSelectedVehicleSelector = createSelector(
            selectPatients,
            (patients) =>
                Object.values(patients).filter((patient) =>
                    isInSpecificVehicle(patient, this.selectedVehicle?.id ?? '')
                )
        );
        this.patients$ = this.store.select(
            createSelector(
                patientsInSimulatedRegionSelector,
                patientsInSelectedVehicleSelector,
                selectConfiguration,
                (patientsInRegion, patientsInVehicle, configuration) =>
                    [...patientsInRegion, ...patientsInVehicle]
                        .sort((patientA, patientB) =>
                            comparePatientsByVisibleStatus(
                                patientA,
                                patientB,
                                configuration
                            )
                        )
                        .map((patient) => ({
                            visibleStatus: Patient.getVisibleStatus(
                                patient,
                                configuration.pretriageEnabled,
                                configuration.bluePatientsEnabled
                            ),
                            ...patient,
                        }))
            )
        );

        this.patients$.pipe(takeUntil(this.destroy$)).subscribe((patients) => {
            Object.entries(this.selectedPatients).forEach(
                ([patientId, clicked]) => {
                    if (
                        !patients
                            .map((patient) => patient.id)
                            .includes(patientId)
                    ) {
                        if (clicked) {
                            this.minPatients--;
                        }
                        delete this.selectedPatients[patientId];
                    }
                }
            );
        });
    }
}
