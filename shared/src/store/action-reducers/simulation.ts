import {
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
    ExerciseSimulationEvent,
    ReportableInformation,
    TreatPatientsBehaviorState,
    UnloadArrivingVehiclesBehaviorState,
} from '../../simulation/index.js';
import {
    reportableInformationTypeToGermanNameDictionary,
    behaviorTypeToGermanNameDictionary,
    updateRequestPatientCountsDelay,
    updateRequestVehiclesDelay,
    TransferPatientsInSpecificVehicleRequestEvent,
    TransferSpecificVehicleRequestEvent,
    updateBehaviorsRequestTarget,
    updateBehaviorsRequestInterval,
    reportableInformationAllowedValues,
    RecurringEventActivityState,
    TransferVehiclesRequestEvent,
} from '../../simulation/index.js';
import { StartCollectingInformationEvent } from '../../simulation/events/start-collecting.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { nextUUID } from '../../simulation/utils/randomness.js';
import type { Mutable, UUID, UUIDSet } from '../../utils/index.js';
import {
    uuidValidationOptions,
    cloneDeepMutable,
    uuidArrayValidationOptions,
    formatDuration,
} from '../../utils/index.js';
import {
    IsLiteralUnion,
    IsUUIDSet,
    IsValue,
} from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import type {
    ExerciseRequestTargetConfiguration,
    PatientStatus,
    PatientStatusForTransport,
} from '../../models/index.js';
import {
    requestTargetTypeOptions,
    patientStatusForTransportAllowedValues,
    patientStatusAllowedValues,
    statusNames,
    createSimulatedRegionTag,
    createPatientStatusTag,
    createVehicleTypeTag,
    isInSimulatedRegion,
    currentSimulatedRegionIdOf,
    createTransferPointTag,
} from '../../models/index.js';
import type { TransferDestination } from '../../simulation/utils/transfer-destination.js';
import { transferDestinationTypeAllowedValues } from '../../simulation/utils/transfer-destination.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { IsResourceDescription } from '../../utils/validators/is-resource-description.js';
import { getActivityById, getBehaviorById, getElement } from './utils/index.js';
import { logBehavior } from './utils/log.js';

export class UpdateTreatPatientsIntervalsAction implements Action {
    @IsValue('[TreatPatientsBehavior] Update TreatPatientsIntervals' as const)
    public readonly type =
        '[TreatPatientsBehavior] Update TreatPatientsIntervals';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorStateId!: UUID;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public readonly unknown?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public readonly counted?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public readonly triaged?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public readonly secured?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    public readonly countingTimePerPatient?: number;
}

export class ProvidePersonnelBehaviorUpdateVehiclePrioritiesAction
    implements Action
{
    @IsValue('[ProvidePersonnelBehavior] Update VehiclePriorities' as const)
    public readonly type =
        '[ProvidePersonnelBehavior] Update VehiclePriorities';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidArrayValidationOptions)
    public readonly priorities!: readonly UUID[];
}

export class UnloadArrivingVehiclesBehaviorUpdateUnloadDelayAction
    implements Action
{
    @IsValue('[UnloadArrivingVehiclesBehavior] Update UnloadDelay' as const)
    public readonly type =
        '[UnloadArrivingVehiclesBehavior] Update UnloadDelay';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsNumber()
    @Min(0)
    public readonly unloadDelay!: number;
}

export class CreateReportAction implements Action {
    @IsValue('[ReportBehavior] Create Report')
    public readonly type = '[ReportBehavior] Create Report';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsLiteralUnion(reportableInformationAllowedValues)
    public readonly informationType!: ReportableInformation;

    @IsString()
    @ValidateIf((_, value) => value !== null)
    public readonly interfaceSignallerKey!: string | null;
}

export class UpdateReportTreatmentStatusChangesAction implements Action {
    @IsValue('[ReportBehavior] Update report treatment status changes')
    public readonly type =
        '[ReportBehavior] Update report treatment status changes';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsBoolean()
    public readonly reportChanges!: boolean;
}

export class UpdateReportTransferOfCategoryInSingleRegionCompletedAction
    implements Action
{
    @IsValue(
        '[ReportBehavior] Update report transfer of category in single region completed'
    )
    public readonly type =
        '[ReportBehavior] Update report transfer of category in single region completed';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsBoolean()
    public readonly reportChanges!: boolean;
}

export class UpdateReportTransferOfCategoryInMultipleRegionsCompletedAction
    implements Action
{
    @IsValue(
        '[ReportBehavior] Update report transfer of category in multiple regions completed'
    )
    public readonly type =
        '[ReportBehavior] Update report transfer of category in multiple regions completed';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsBoolean()
    public readonly reportChanges!: boolean;
}

export class CreateRecurringReportsAction implements Action {
    @IsValue('[ReportBehavior] Create Recurring Report')
    public readonly type = '[ReportBehavior] Create Recurring Report';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsNumber()
    @Min(0)
    public readonly interval!: number;

    @IsLiteralUnion(reportableInformationAllowedValues)
    public readonly informationType!: ReportableInformation;
}

export class UpdateRecurringReportsAction implements Action {
    @IsValue('[ReportBehavior] Update Recurring Report')
    public readonly type = '[ReportBehavior] Update Recurring Report';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsNumber()
    @Min(0)
    public readonly interval!: number;

    @IsLiteralUnion(reportableInformationAllowedValues)
    public readonly informationType!: ReportableInformation;
}

export class RemoveRecurringReportsAction implements Action {
    @IsValue('[ReportBehavior] Remove Recurring Report')
    public readonly type = '[ReportBehavior] Remove Recurring Report';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsLiteralUnion(reportableInformationAllowedValues)
    public readonly informationType!: ReportableInformation;
}

export class ChangeAutomaticDistributionLimitAction implements Action {
    @IsValue('[AutomaticDistributionBehavior] Change Limit')
    public readonly type = '[AutomaticDistributionBehavior] Change Limit';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsString()
    public readonly vehicleType!: string;

    @IsInt()
    @Min(0)
    public readonly newLimit!: number;
}
export class UpdateRequestIntervalAction implements Action {
    @IsValue('[RequestBehavior] Update RequestInterval')
    public readonly type = '[RequestBehavior] Update RequestInterval';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly requestInterval!: number;
}

export class AddAutomaticDistributionDestinationAction implements Action {
    @IsValue('[AutomaticDistributionBehavior] Add Destination')
    public readonly type = '[AutomaticDistributionBehavior] Add Destination';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly destinationId!: string;
}

export class UpdateRequestTargetAction implements Action {
    @IsValue('[RequestBehavior] Update RequestTarget')
    public readonly type = '[RequestBehavior] Update RequestTarget';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @Type(...requestTargetTypeOptions)
    @ValidateNested()
    public readonly requestTarget!: ExerciseRequestTargetConfiguration;
}

export class RemoveAutomaticDistributionDestinationAction implements Action {
    @IsValue('[AutomaticDistributionBehavior] Remove Destination')
    public readonly type = '[AutomaticDistributionBehavior] Remove Destination';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly destinationId!: string;
}

export class UpdatePromiseInvalidationIntervalAction implements Action {
    @IsValue('[RequestBehavior] Update Promise invalidation interval')
    public readonly type =
        '[RequestBehavior] Update Promise invalidation interval';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly promiseInvalidationInterval!: number;
}

export class UpdatePatientLoadTimeAction implements Action {
    @IsValue('[TransferBehavior] Update Patient Load Time')
    public readonly type = '[TransferBehavior] Update Patient Load Time';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly loadTimePerPatient!: number;
}

export class UpdatePersonnelLoadTimeAction implements Action {
    @IsValue('[TransferBehavior] Update Personnel Load Time')
    public readonly type = '[TransferBehavior] Update Personnel Load Time';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly personnelLoadTime!: number;
}

export class UpdateDelayBetweenSendsAction implements Action {
    @IsValue('[TransferBehavior] Update Delay Between Sends')
    public readonly type = '[TransferBehavior] Update Delay Between Sends';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly delayBetweenSends!: number;
}

export class SendTransferRequestEventAction implements Action {
    @IsValue('[TransferBehavior] Send Transfer Request Event')
    public readonly type = '[TransferBehavior] Send Transfer Request Event';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;

    @IsLiteralUnion(transferDestinationTypeAllowedValues)
    public readonly destinationType!: TransferDestination;

    @IsUUID(4, uuidValidationOptions)
    public readonly destinationId!: UUID;

    @IsUUIDSet()
    public readonly patients!: UUIDSet;
}

export class TransferVehiclesAction implements Action {
    @IsValue('[TransferBehavior] Transfer Vehicles')
    public readonly type = '[TransferBehavior] Transfer Vehicles';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsResourceDescription()
    readonly requestedVehicles!: ResourceDescription;

    @IsLiteralUnion(transferDestinationTypeAllowedValues)
    public readonly destinationType!: TransferDestination;

    @IsUUID(4, uuidValidationOptions)
    public readonly destinationId!: UUID;
}

export class ChangeTransportRequestTargetAction implements Action {
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly requestTargetId?: UUID;
}

export class AddSimulatedRegionToManageForTransportAction implements Action {
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Add Simulated Region To Manage For Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Add Simulated Region To Manage For Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly managedSimulatedRegionId!: UUID;
}

export class RemoveSimulatedRegionToManageFromTransportAction
    implements Action
{
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly managedSimulatedRegionId!: UUID;
}

export class UpdatePatientsExpectedInRegionForTransportAction
    implements Action
{
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Update Patients Expected In Region For Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Update Patients Expected In Region For Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly managedSimulatedRegionId!: UUID;

    @IsInt()
    @Min(0)
    public readonly patientsExpected!: number;

    @IsLiteralUnion(patientStatusAllowedValues)
    public readonly patientStatus!: PatientStatus;
}

export class AddVehicleTypeForPatientTransportAction implements Action {
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Add Vehicle Type For Patient Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Add Vehicle Type For Patient Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsString()
    public readonly vehicleTypeName!: string;

    @IsLiteralUnion(patientStatusForTransportAllowedValues)
    public readonly patientStatus!: PatientStatusForTransport;
}

export class RemoveVehicleTypeForPatientTransportAction implements Action {
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Remove Vehicle Type For Patient Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Remove Vehicle Type For Patient Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsString()
    public readonly vehicleTypeName!: string;

    @IsLiteralUnion(patientStatusForTransportAllowedValues)
    public readonly patientStatus!: PatientStatusForTransport;
}

export class UpdateRequestVehicleDelayForPatientTransportAction
    implements Action
{
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Update Request Vehicle Delay For Patient Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Update Request Vehicle Delay For Patient Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly requestVehicleDelay!: number;
}

export class UpdateRequestPatientCountDelayForPatientTransportAction
    implements Action
{
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Update Request Patient Count Delay For Patient Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Update Request Patient Count Delay For Patient Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly requestPatientCountDelay!: number;
}

export class UpdatePromiseInvalidationIntervalForPatientTransportAction
    implements Action
{
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Update Promise Invalidation Interval For Patient Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Update Promise Invalidation Interval For Patient Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsInt()
    @Min(0)
    public readonly promiseInvalidationInterval!: number;
}

export class UpdateMaximumCategoryToTransportAction implements Action {
    @IsValue(
        '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport'
    )
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;

    @IsLiteralUnion(patientStatusForTransportAllowedValues)
    public readonly maximumCategoryToTransport!: PatientStatusForTransport;
}

export class StartTransportAction implements Action {
    @IsValue('[ManagePatientsTransportToHospitalBehavior] Start Transport')
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Start Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;
}

export class StopTransportAction implements Action {
    @IsValue('[ManagePatientsTransportToHospitalBehavior] Stop Transport')
    public readonly type =
        '[ManagePatientsTransportToHospitalBehavior] Stop Transport';

    @IsUUID(4, uuidValidationOptions)
    public readonly simulatedRegionId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly behaviorId!: UUID;
}

export namespace SimulationActionReducers {
    export const updateTreatPatientsIntervals: ActionReducer<UpdateTreatPatientsIntervalsAction> =
        {
            action: UpdateTreatPatientsIntervalsAction,
            /*
             *   unknown, counted, triaged, secured, countingTimePerPatient stay the same when undefined
             */
            reducer: (
                draftState,
                {
                    simulatedRegionId,
                    behaviorStateId,
                    unknown,
                    counted,
                    triaged,
                    secured,
                    countingTimePerPatient,
                }
            ) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorStates = simulatedRegion.behaviors;
                const treatPatientsBehaviorState = behaviorStates.find(
                    (behaviorState) => behaviorState.id === behaviorStateId
                ) as Mutable<TreatPatientsBehaviorState>;

                if (unknown !== undefined) {
                    treatPatientsBehaviorState.intervals.unknown = unknown;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                treatPatientsBehaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } wird in der Phase Erkunden alle ${formatDuration(
                            unknown
                        )} die Zuteilung neu berechnen`,
                        simulatedRegionId,
                        behaviorStateId
                    );
                }
                if (counted !== undefined) {
                    treatPatientsBehaviorState.intervals.counted = counted;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                treatPatientsBehaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } wird in der Phase Vorsichtung alle ${formatDuration(
                            counted
                        )} die Zuteilung neu berechnen`,
                        simulatedRegionId,
                        behaviorStateId
                    );
                }
                if (triaged !== undefined) {
                    treatPatientsBehaviorState.intervals.triaged = triaged;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                treatPatientsBehaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } wird in der Phase Behandeln, Personal fehlt alle ${formatDuration(
                            triaged
                        )} die Zuteilung neu berechnen`,
                        simulatedRegionId,
                        behaviorStateId
                    );
                }
                if (secured !== undefined) {
                    treatPatientsBehaviorState.intervals.secured = secured;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                treatPatientsBehaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } wird in der Phase Erstversogung sichergestellt alle ${formatDuration(
                            secured
                        )} die Zuteilung neu berechnen`,
                        simulatedRegionId,
                        behaviorStateId
                    );
                }
                if (countingTimePerPatient !== undefined) {
                    treatPatientsBehaviorState.intervals.countingTimePerPatient =
                        countingTimePerPatient;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                treatPatientsBehaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } wird für das Zählen pro Patient ${formatDuration(
                            countingTimePerPatient
                        )} benötigen`,
                        simulatedRegionId,
                        behaviorStateId
                    );
                }
                return draftState;
            },
            rights: 'trainer',
        };

    export const unloadArrivingVehiclesBehaviorUpdateUnloadDelay: ActionReducer<UnloadArrivingVehiclesBehaviorUpdateUnloadDelayAction> =
        {
            action: UnloadArrivingVehiclesBehaviorUpdateUnloadDelayAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, unloadDelay }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = simulatedRegion.behaviors.find(
                    (behavior) => behavior.id === behaviorId
                ) as Mutable<UnloadArrivingVehiclesBehaviorState> | undefined;

                if (behaviorState) {
                    behaviorState.unloadDelay = unloadDelay;
                    logBehavior(
                        draftState,
                        [],
                        `Das ${
                            behaviorTypeToGermanNameDictionary[
                                behaviorState.type
                            ]
                        } Verhalten im Bereich ${
                            simulatedRegion.name
                        } benötigt ${formatDuration(
                            unloadDelay
                        )}, um Fahrzeuge zu entladen.`,
                        simulatedRegionId,
                        behaviorId
                    );
                } else {
                    throw new ReducerError(
                        `The simulated region with id ${simulatedRegionId} has no behavior with id ${behaviorId}.`
                    );
                }
                return draftState;
            },
            rights: 'trainer',
        };

    export const createReport: ActionReducer<CreateReportAction> = {
        action: CreateReportAction,
        reducer(
            draftState,
            { simulatedRegionId, informationType, interfaceSignallerKey }
        ) {
            const simulatedRegion = getElement(
                draftState,
                'simulatedRegion',
                simulatedRegionId
            );
            sendSimulationEvent(
                simulatedRegion,
                StartCollectingInformationEvent.create(
                    informationType,
                    interfaceSignallerKey
                )
            );

            return draftState;
        },
        rights: 'trainer',
    };

    export const updateReportTreatmentStatusChanges: ActionReducer<UpdateReportTreatmentStatusChangesAction> =
        {
            action: UpdateReportTreatmentStatusChangesAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, reportChanges }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Behandlungsfortschrittsänderungen ${
                        reportChanges ? '' : 'nicht '
                    }melden.`,
                    simulatedRegionId,
                    behaviorId
                );

                reportBehaviorState.reportTreatmentProgressChanges =
                    reportChanges;

                return draftState;
            },
            rights: 'trainer',
        };

    export const updateReportTransferOfCategoryInSingleRegionCompleted: ActionReducer<UpdateReportTransferOfCategoryInSingleRegionCompletedAction> =
        {
            action: UpdateReportTransferOfCategoryInSingleRegionCompletedAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, reportChanges }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird den Abschluss des Transports aller Patienten einer Sichtungskategorie in der Region ${
                        reportChanges ? '' : 'nicht '
                    }melden.`,
                    simulatedRegionId,
                    behaviorId
                );

                reportBehaviorState.reportTransferOfCategoryInSingleRegionCompleted =
                    reportChanges;

                return draftState;
            },
            rights: 'trainer',
        };

    export const updateReportTransferOfCategoryInMultipleRegionsCompleted: ActionReducer<UpdateReportTransferOfCategoryInMultipleRegionsCompletedAction> =
        {
            action: UpdateReportTransferOfCategoryInMultipleRegionsCompletedAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, reportChanges }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird den Abschluss des Transports aller Patienten einer Sichtungskategorie der Regionen die von ${
                        simulatedRegion.name
                    } als TO bedient werden ${
                        reportChanges ? '' : 'nicht '
                    }melden.`,
                    simulatedRegionId,
                    behaviorId
                );

                reportBehaviorState.reportTransferOfCategoryInMultipleRegionsCompleted =
                    reportChanges;

                return draftState;
            },
            rights: 'trainer',
        };

    export const createRecurringReports: ActionReducer<CreateRecurringReportsAction> =
        {
            action: CreateRecurringReportsAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, interval, informationType }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );

                if (reportBehaviorState.activityIds[informationType]) {
                    throw new ExpectedReducerError(
                        `The behavior with id ${behaviorId} already has a recurring report for information type ${reportableInformationTypeToGermanNameDictionary[informationType]}.`
                    );
                }

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Informationen vom Typ ${
                        reportableInformationTypeToGermanNameDictionary[
                            informationType
                        ]
                    } alle ${formatDuration(interval)} melden.`,
                    simulatedRegionId,
                    behaviorId
                );

                const activityId = nextUUID(draftState);
                reportBehaviorState.activityIds[informationType] = activityId;
                simulatedRegion.activities[activityId] = cloneDeepMutable(
                    RecurringEventActivityState.create(
                        activityId,
                        StartCollectingInformationEvent.create(informationType),
                        draftState.currentTime + interval,
                        interval
                    )
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const updateRecurringReports: ActionReducer<UpdateRecurringReportsAction> =
        {
            action: UpdateRecurringReportsAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, interval, informationType }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );
                const activityId =
                    reportBehaviorState.activityIds[informationType];
                if (!activityId) {
                    throw new ReducerError(
                        `The behavior with id ${behaviorId} has no recurring report for information type ${reportableInformationTypeToGermanNameDictionary[informationType]}.`
                    );
                }
                const recurringActivityState = getActivityById(
                    draftState,
                    simulatedRegionId,
                    activityId,
                    'recurringEventActivity'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Informationen vom Typ ${
                        reportableInformationTypeToGermanNameDictionary[
                            informationType
                        ]
                    } alle ${formatDuration(interval)} melden.`,
                    simulatedRegionId,
                    behaviorId
                );

                recurringActivityState.recurrenceIntervalTime = interval;

                return draftState;
            },
            rights: 'trainer',
        };

    export const removeRecurringReports: ActionReducer<RemoveRecurringReportsAction> =
        {
            action: RemoveRecurringReportsAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, informationType }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const reportBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'reportBehavior'
                );
                const activityId =
                    reportBehaviorState.activityIds[informationType];
                if (!activityId) {
                    throw new ReducerError(
                        `The behavior with id ${behaviorId} has no recurring report for information type ${reportableInformationTypeToGermanNameDictionary[informationType]}.`
                    );
                }
                getActivityById(
                    draftState,
                    simulatedRegionId,
                    activityId,
                    'recurringEventActivity'
                );
                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            reportBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Informationen vom Typ ${
                        reportableInformationTypeToGermanNameDictionary[
                            informationType
                        ]
                    } nicht melden.`,
                    simulatedRegionId,
                    behaviorId
                );
                delete reportBehaviorState.activityIds[informationType];
                delete simulatedRegion.activities[activityId];

                return draftState;
            },
            rights: 'trainer',
        };

    export const changeAutomaticDistributionLimit: ActionReducer<ChangeAutomaticDistributionLimitAction> =
        {
            action: ChangeAutomaticDistributionLimitAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, vehicleType, newLimit }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const automaticDistributionBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'automaticallyDistributeVehiclesBehavior'
                );

                logBehavior(
                    draftState,
                    [createVehicleTypeTag(draftState, vehicleType)],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            automaticDistributionBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Fahrzeuge vom Typ ${vehicleType} ${
                        newLimit < Number.MAX_VALUE
                            ? newLimit === 0
                                ? 'nicht'
                                : `bis zu einem Limit von ${newLimit}`
                            : 'ohne Limit'
                    } verteilen.`,
                    simulatedRegionId,
                    behaviorId
                );

                automaticDistributionBehaviorState.distributionLimits[
                    vehicleType
                ] = newLimit;

                if (newLimit === 0) {
                    delete automaticDistributionBehaviorState.remainingInNeed[
                        vehicleType
                    ];
                } else {
                    automaticDistributionBehaviorState.remainingInNeed[
                        vehicleType
                    ] ??= cloneDeepMutable(
                        automaticDistributionBehaviorState.distributionDestinations
                    );
                }
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateRequestInterval: ActionReducer<UpdateRequestIntervalAction> =
        {
            action: UpdateRequestIntervalAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, requestInterval }
            ) {
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'requestBehavior'
                );
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird alle ${formatDuration(
                        requestInterval
                    )} Anfragen versenden.`,
                    simulatedRegionId,
                    behaviorId
                );
                updateBehaviorsRequestInterval(
                    draftState,
                    simulatedRegion,
                    behaviorState,
                    requestInterval
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const addAutomaticDistributionDestination: ActionReducer<AddAutomaticDistributionDestinationAction> =
        {
            action: AddAutomaticDistributionDestinationAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, destinationId }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const automaticDistributionBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'automaticallyDistributeVehiclesBehavior'
                );
                const destination = getElement(
                    draftState,
                    'transferPoint',
                    destinationId
                );

                //  Do not re-add the destination if it was already added previously

                if (
                    automaticDistributionBehaviorState.distributionDestinations[
                        destinationId
                    ]
                ) {
                    throw new ReducerError(
                        `The destination with id: ${destinationId} was already added to the behavior with id: ${behaviorId} in simulated region with id:${simulatedRegionId}`
                    );
                }

                logBehavior(
                    draftState,
                    [
                        isInSimulatedRegion(destination)
                            ? createSimulatedRegionTag(
                                  draftState,
                                  currentSimulatedRegionIdOf(destination)
                              )
                            : createTransferPointTag(draftState, destinationId),
                    ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            automaticDistributionBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Fahrzeuge nach ${
                        destination.externalName
                    } schicken.`,
                    simulatedRegionId,
                    behaviorId
                );

                automaticDistributionBehaviorState.distributionDestinations[
                    destinationId
                ] = true;

                Object.values(
                    automaticDistributionBehaviorState.remainingInNeed
                ).forEach((regionsInNeed) => {
                    regionsInNeed[destinationId] = true;
                });
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateRequestTarget: ActionReducer<UpdateRequestTargetAction> =
        {
            action: UpdateRequestTargetAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, requestTarget }
            ) {
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'requestBehavior'
                );
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );

                logBehavior(
                    draftState,
                    requestTarget.type === 'traineesRequestTarget'
                        ? []
                        : [
                              createSimulatedRegionTag(
                                  draftState,
                                  requestTarget.targetSimulatedRegionId
                              ),
                          ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Fahrzeuge von ${
                        requestTarget.type === 'traineesRequestTarget'
                            ? 'den Übenden'
                            : getElement(
                                  draftState,
                                  'simulatedRegion',
                                  requestTarget.targetSimulatedRegionId
                              ).name
                    } anfragen.`,
                    simulatedRegionId,
                    behaviorId
                );

                updateBehaviorsRequestTarget(
                    draftState,
                    simulatedRegion,
                    behaviorState,
                    requestTarget
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeAutomaticDistributionDestination: ActionReducer<RemoveAutomaticDistributionDestinationAction> =
        {
            action: RemoveAutomaticDistributionDestinationAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, destinationId }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const automaticDistributionBehaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'automaticallyDistributeVehiclesBehavior'
                );
                const destination = getElement(
                    draftState,
                    'transferPoint',
                    destinationId
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[
                            automaticDistributionBehaviorState.type
                        ]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird keine Fahrzeuge nach ${
                        destination.externalName
                    } schicken.`,
                    simulatedRegionId,
                    behaviorId
                );

                delete automaticDistributionBehaviorState
                    .distributionDestinations[destinationId];

                Object.values(
                    automaticDistributionBehaviorState.remainingInNeed
                ).forEach((regionsInNeed) => {
                    delete regionsInNeed[destinationId];
                });
                return draftState;
            },
            rights: 'trainer',
        };
    export const updatePromiseInvalidationInterval: ActionReducer<UpdatePromiseInvalidationIntervalAction> =
        {
            action: UpdatePromiseInvalidationIntervalAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, promiseInvalidationInterval }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'requestBehavior'
                );
                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird versprochene Fahrzeuge nach ${formatDuration(
                        promiseInvalidationInterval
                    )} ignorieren.`,
                    simulatedRegionId,
                    behaviorId
                );
                behaviorState.invalidatePromiseInterval =
                    promiseInvalidationInterval;
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateTreatmentVehiclePriorities: ActionReducer<ProvidePersonnelBehaviorUpdateVehiclePrioritiesAction> =
        {
            action: ProvidePersonnelBehaviorUpdateVehiclePrioritiesAction,
            reducer(draftState, { simulatedRegionId, behaviorId, priorities }) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'providePersonnelBehavior'
                );

                const prioritiesString = priorities
                    .map((priority, i) => {
                        const vehicleType = draftState.vehicleTemplates.find(
                            (vehicleTemplate) => vehicleTemplate.id === priority
                        )!.vehicleType;
                        return `${i + 1}. ${vehicleType}`;
                    })
                    .join(' ');

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } wird Fahrzeuge nach der folgenden Priorisierung anfordern: ${prioritiesString}.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.vehicleTemplatePriorities =
                    cloneDeepMutable(priorities);

                return draftState;
            },
            rights: 'trainer',
        };

    export const updatePatientLoadTime: ActionReducer<UpdatePatientLoadTimeAction> =
        {
            action: UpdatePatientLoadTimeAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, loadTimePerPatient }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'transferBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } benötigt ${formatDuration(
                        loadTimePerPatient
                    )} pro Patient, der eingeladen wird.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.loadTimePerPatient = loadTimePerPatient;

                return draftState;
            },
            rights: 'trainer',
        };

    export const updatePersonnelLoadTime: ActionReducer<UpdatePersonnelLoadTimeAction> =
        {
            action: UpdatePersonnelLoadTimeAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, personnelLoadTime }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'transferBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } benötigt ${formatDuration(
                        personnelLoadTime
                    )}, um das Personal einzuladen.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.personnelLoadTime = personnelLoadTime;

                return draftState;
            },
            rights: 'trainer',
        };

    export const updateDelayBetweenSends: ActionReducer<UpdateDelayBetweenSendsAction> =
        {
            action: UpdateDelayBetweenSendsAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, delayBetweenSends }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'transferBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } kann alle ${formatDuration(
                        delayBetweenSends
                    )} ein Fahrzeug versenden.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.delayBetweenSends = delayBetweenSends;

                // also update the value inside the activity if one is running already

                if (behaviorState.recurringActivityId) {
                    const reccuringActivity = getActivityById(
                        draftState,
                        simulatedRegionId,
                        behaviorState.recurringActivityId,
                        'recurringEventActivity'
                    );
                    reccuringActivity.recurrenceIntervalTime =
                        delayBetweenSends;
                }

                return draftState;
            },
            rights: 'trainer',
        };

    export const sendTransferRequestEvent: ActionReducer<SendTransferRequestEventAction> =
        {
            action: SendTransferRequestEventAction,
            reducer(
                draftState,
                {
                    simulatedRegionId,
                    vehicleId,
                    destinationType,
                    destinationId,
                    patients,
                }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );

                let event: ExerciseSimulationEvent;
                if (Object.keys(cloneDeepMutable(patients)).length === 0) {
                    event = TransferSpecificVehicleRequestEvent.create(
                        vehicleId,
                        destinationType,
                        destinationId,
                        destinationId
                    );
                } else {
                    event =
                        TransferPatientsInSpecificVehicleRequestEvent.create(
                            patients,
                            vehicleId,
                            destinationType,
                            destinationId,
                            destinationId
                        );
                }

                sendSimulationEvent(simulatedRegion, event);
                return draftState;
            },
            rights: 'trainer',
        };

    export const transferVehicles: ActionReducer<TransferVehiclesAction> = {
        action: TransferVehiclesAction,
        reducer(
            draftState,
            {
                simulatedRegionId,
                requestedVehicles,
                destinationType,
                destinationId,
            }
        ) {
            const simulatedRegion = getElement(
                draftState,
                'simulatedRegion',
                simulatedRegionId
            );

            sendSimulationEvent(
                simulatedRegion,
                TransferVehiclesRequestEvent.create(
                    requestedVehicles,
                    destinationType,
                    destinationId
                )
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const changeTransportRequestTarget: ActionReducer<ChangeTransportRequestTargetAction> =
        {
            action: ChangeTransportRequestTargetAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, requestTargetId }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );

                logBehavior(
                    draftState,
                    requestTargetId === undefined ||
                        requestTargetId === simulatedRegionId
                        ? []
                        : [
                              createSimulatedRegionTag(
                                  draftState,
                                  requestTargetId
                              ),
                          ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${simulatedRegion.name} fordert ${
                        requestTargetId === undefined
                            ? 'keine Fahrzeuge'
                            : `Fahrzeuge von ${
                                  getElement(
                                      draftState,
                                      'simulatedRegion',
                                      requestTargetId
                                  ).name
                              }`
                    } an.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.requestTargetId = requestTargetId;
                return draftState;
            },
            rights: 'trainer',
        };

    export const addSimulatedRegionToManageForTransport: ActionReducer<AddSimulatedRegionToManageForTransportAction> =
        {
            action: AddSimulatedRegionToManageForTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, managedSimulatedRegionId }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );
                const managedSimulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    managedSimulatedRegionId
                );

                logBehavior(
                    draftState,
                    managedSimulatedRegionId === simulatedRegionId
                        ? []
                        : [
                              createSimulatedRegionTag(
                                  draftState,
                                  managedSimulatedRegionId
                              ),
                          ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } verwaltet den Patientenabtransport im Bereich ${
                        managedSimulatedRegion.name
                    }.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.simulatedRegionsToManage[
                    managedSimulatedRegionId
                ] = true;

                behaviorState.patientsExpectedInRegions[
                    managedSimulatedRegionId
                ] ??= {
                    red: 0,
                    yellow: 0,
                    green: 0,
                    blue: 0,
                    black: 0,
                    white: 0,
                };

                return draftState;
            },
            rights: 'trainer',
        };

    export const removeSimulatedRegionToManageForTransport: ActionReducer<RemoveSimulatedRegionToManageFromTransportAction> =
        {
            action: RemoveSimulatedRegionToManageFromTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, managedSimulatedRegionId }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );
                const managedSimulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    managedSimulatedRegionId
                );
                logBehavior(
                    draftState,
                    managedSimulatedRegionId === simulatedRegionId
                        ? []
                        : [
                              createSimulatedRegionTag(
                                  draftState,
                                  managedSimulatedRegionId
                              ),
                          ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } verwaltet den Patientenabtransport im Bereich ${
                        managedSimulatedRegion.name
                    } nicht.`,
                    simulatedRegionId,
                    behaviorId
                );
                delete behaviorState.simulatedRegionsToManage[
                    managedSimulatedRegionId
                ];
                return draftState;
            },
            rights: 'trainer',
        };

    export const updatePatientsExpectedInRegionForTransport: ActionReducer<UpdatePatientsExpectedInRegionForTransportAction> =
        {
            action: UpdatePatientsExpectedInRegionForTransportAction,
            reducer(
                draftState,
                {
                    simulatedRegionId,
                    behaviorId,
                    managedSimulatedRegionId,
                    patientsExpected,
                    patientStatus,
                }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );
                const managedSimulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    managedSimulatedRegionId
                );

                if (
                    !behaviorState.patientsExpectedInRegions[
                        managedSimulatedRegionId
                    ]
                ) {
                    throw new ReducerError(
                        `Expected ManagePatientsTransportToHospitalBehaviorState to manage simulated region with id ${managedSimulatedRegionId}, but it did not`
                    );
                }

                logBehavior(
                    draftState,
                    [
                        createPatientStatusTag(draftState, patientStatus),
                        ...(managedSimulatedRegionId === simulatedRegionId
                            ? []
                            : [
                                  createSimulatedRegionTag(
                                      draftState,
                                      managedSimulatedRegionId
                                  ),
                              ]),
                    ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } erwartet ${patientsExpected} ${
                        statusNames[patientStatus]
                    } Patienten im Bereich ${managedSimulatedRegion.name}.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.patientsExpectedInRegions[
                    managedSimulatedRegionId
                ][patientStatus] = patientsExpected;
                return draftState;
            },
            rights: 'trainer',
        };

    export const addVehicleTypeForPatientTransport: ActionReducer<AddVehicleTypeForPatientTransportAction> =
        {
            action: AddVehicleTypeForPatientTransportAction,
            reducer(
                draftState,
                {
                    simulatedRegionId,
                    behaviorId,
                    vehicleTypeName,
                    patientStatus,
                }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );

                if (
                    behaviorState.vehiclesForPatients[patientStatus].includes(
                        vehicleTypeName
                    )
                ) {
                    throw new ReducerError(
                        `Expected vehicle type ${vehicleTypeName} to not yet be assigned to patients with status ${patientStatus}, but it was`
                    );
                }

                logBehavior(
                    draftState,
                    [
                        createPatientStatusTag(draftState, patientStatus),
                        createVehicleTypeTag(draftState, vehicleTypeName),
                    ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } verwendet Fahrzeuge vom Typ ${vehicleTypeName} um ${
                        statusNames[patientStatus]
                    } Patienten abzutransportieren.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.vehiclesForPatients[patientStatus].push(
                    vehicleTypeName
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeVehicleTypeForPatientTransport: ActionReducer<RemoveVehicleTypeForPatientTransportAction> =
        {
            action: RemoveVehicleTypeForPatientTransportAction,
            reducer(
                draftState,
                {
                    simulatedRegionId,
                    behaviorId,
                    vehicleTypeName,
                    patientStatus,
                }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );

                if (
                    !behaviorState.vehiclesForPatients[patientStatus].includes(
                        vehicleTypeName
                    )
                ) {
                    throw new ReducerError(
                        `Expected vehicle type ${vehicleTypeName} to be assigned to patients with status ${patientStatus}, but was not`
                    );
                }

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } verwendet keine Fahrzeuge vom Typ ${vehicleTypeName} um ${
                        statusNames[patientStatus]
                    } Patienten abzutransportieren.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.vehiclesForPatients[patientStatus].splice(
                    behaviorState.vehiclesForPatients[patientStatus].indexOf(
                        vehicleTypeName
                    ),
                    1
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateRequestVehicleDelayForPatientTransport: ActionReducer<UpdateRequestVehicleDelayForPatientTransportAction> =
        {
            action: UpdateRequestVehicleDelayForPatientTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, requestVehicleDelay }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } fordet alle ${formatDuration(
                        requestVehicleDelay
                    )} Fahrzeuge an, um Patienten abzutransportieren.`,
                    simulatedRegionId,
                    behaviorId
                );

                updateRequestVehiclesDelay(
                    draftState,
                    simulatedRegionId,
                    behaviorState,
                    requestVehicleDelay
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateRequestPatientCountDelayForPatientTransport: ActionReducer<UpdateRequestPatientCountDelayForPatientTransportAction> =
        {
            action: UpdateRequestPatientCountDelayForPatientTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, requestPatientCountDelay }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );

                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } fordet alle ${formatDuration(
                        requestPatientCountDelay
                    )} Patientenzahlen an.`,
                    simulatedRegionId,
                    behaviorId
                );

                updateRequestPatientCountsDelay(
                    draftState,
                    simulatedRegionId,
                    behaviorState,
                    requestPatientCountDelay
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const updatePromiseInvalidationIntervalForPatientTransport: ActionReducer<UpdatePromiseInvalidationIntervalForPatientTransportAction> =
        {
            action: UpdatePromiseInvalidationIntervalForPatientTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, promiseInvalidationInterval }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );
                logBehavior(
                    draftState,
                    [],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } ignoriert zugesagte Fahrzeuge nach ${formatDuration(
                        promiseInvalidationInterval
                    )}.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.promiseInvalidationInterval =
                    promiseInvalidationInterval;
                return draftState;
            },
            rights: 'trainer',
        };

    export const updateMaximumCategoryToTransport: ActionReducer<UpdateMaximumCategoryToTransportAction> =
        {
            action: UpdateMaximumCategoryToTransportAction,
            reducer(
                draftState,
                { simulatedRegionId, behaviorId, maximumCategoryToTransport }
            ) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const behaviorState = getBehaviorById(
                    draftState,
                    simulatedRegionId,
                    behaviorId,
                    'managePatientTransportToHospitalBehavior'
                );
                logBehavior(
                    draftState,
                    [
                        createPatientStatusTag(
                            draftState,
                            maximumCategoryToTransport
                        ),
                    ],
                    `Das ${
                        behaviorTypeToGermanNameDictionary[behaviorState.type]
                    } Verhalten im Bereich ${
                        simulatedRegion.name
                    } transprortiert Patienten bis zu ${
                        statusNames[maximumCategoryToTransport]
                    } Patienten ab.`,
                    simulatedRegionId,
                    behaviorId
                );

                behaviorState.maximumCategoryToTransport =
                    maximumCategoryToTransport;
                return draftState;
            },
            rights: 'trainer',
        };

    export const startTransport: ActionReducer<StartTransportAction> = {
        action: StartTransportAction,
        reducer(draftState, { simulatedRegionId, behaviorId }) {
            const simulatedRegion = getElement(
                draftState,
                'simulatedRegion',
                simulatedRegionId
            );
            const behaviorState = getBehaviorById(
                draftState,
                simulatedRegionId,
                behaviorId,
                'managePatientTransportToHospitalBehavior'
            );

            logBehavior(
                draftState,
                [],
                `Das ${
                    behaviorTypeToGermanNameDictionary[behaviorState.type]
                } Verhalten im Bereich ${
                    simulatedRegion.name
                } transprortiert Patienten ab.`,
                simulatedRegionId,
                behaviorId
            );

            behaviorState.transportStarted = true;
            return draftState;
        },
        rights: 'trainer',
    };

    export const stopTransport: ActionReducer<StopTransportAction> = {
        action: StopTransportAction,
        reducer(draftState, { simulatedRegionId, behaviorId }) {
            const simulatedRegion = getElement(
                draftState,
                'simulatedRegion',
                simulatedRegionId
            );
            const behaviorState = getBehaviorById(
                draftState,
                simulatedRegionId,
                behaviorId,
                'managePatientTransportToHospitalBehavior'
            );

            logBehavior(
                draftState,
                [],
                `Das ${
                    behaviorTypeToGermanNameDictionary[behaviorState.type]
                } Verhalten im Bereich ${
                    simulatedRegion.name
                } transprortiert keine Patienten ab.`,
                simulatedRegionId,
                behaviorId
            );

            behaviorState.transportStarted = false;
            return draftState;
        },
        rights: 'trainer',
    };
}
