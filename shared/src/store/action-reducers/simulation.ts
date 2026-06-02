import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import { newStartCollectingInformationEvent } from '../../simulation/events/start-collecting.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { nextUUID } from '../../simulation/utils/randomness.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import { transferDestinationTypeSchema } from '../../simulation/utils/transfer-destination.js';
import { resourceDescriptionSchema } from '../../models/utils/resource-description.js';
import { uuidSchema } from '../../utils/uuid.js';
import { exerciseRequestTargetConfigurationSchema } from '../../models/utils/request-target/exercise-request-target.js';
import { uuidSetSchema } from '../../utils/uuid-set.js';
import {
    patientStatusForTransportSchema,
    patientStatusSchema,
    statusNames,
} from '../../models/utils/patient-status.js';
import type { TreatPatientsBehaviorState } from '../../simulation/behaviors/treat-patients.js';
import {
    behaviorTypeToGermanNameDictionary,
    reportableInformationSchema,
    reportableInformationTypeToGermanNameDictionary,
} from '../../simulation/behaviors/utils.js';
import { formatDuration } from '../../utils/format-duration.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newRecurringEventActivityState } from '../../simulation/activities/recurring-event.js';
import {
    createPatientStatusTag,
    createSimulatedRegionTag,
    createTransferPointTag,
    createVehicleTypeTag,
} from '../../models/utils/tag-helpers.js';
import {
    updateBehaviorsRequestInterval,
    updateBehaviorsRequestTarget,
} from '../../simulation/behaviors/request.js';
import {
    currentSimulatedRegionIdOf,
    isInSimulatedRegion,
} from '../../models/utils/position/position-helpers.js';
import type { ExerciseSimulationEvent } from '../../simulation/events/exercise-simulation-event.js';
import { newTransferSpecificVehicleRequestEvent } from '../../simulation/events/transfer-specific-vehicle-request.js';
import { newTransferPatientsInSpecificVehicleRequestEvent } from '../../simulation/events/transfer-patients-in-specific-vehicle-request.js';
import { newTransferVehiclesRequestEvent } from '../../simulation/events/transfer-vehicles-request.js';
import {
    updateRequestPatientCountsDelay,
    updateRequestVehiclesDelay,
} from '../../simulation/behaviors/manage-patient-transport-to-hospital.js';
import type { UnloadArrivingVehiclesBehaviorState } from '../../simulation/behaviors/unload-arrived-vehicles.js';
import { simulatedRegionSchema } from '../../models/simulated-region.js';
import { simulationBehaviorStateSchema } from '../../simulation/behaviors/simulation-behavior.js';
import { vehicleSchema } from '../../models/vehicle.js';
import {
    getActivityById,
    getBehaviorById,
    getElement,
} from './utils/get-element.js';
import { logBehavior } from './utils/log.js';

// TODO@Felix: check for @IsInt() decorators

const updateTreatPatientsIntervalsActionSchema = z.strictObject({
    type: z.literal('[TreatPatientsBehavior] Update TreatPatientsIntervals'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorStateId: simulationBehaviorStateSchema.shape.id,
    unknown: z.number().nonnegative().optional(),
    counted: z.number().nonnegative().optional(),
    triaged: z.number().nonnegative().optional(),
    secured: z.number().nonnegative().optional(),
    countingTimePerPatient: z.number().nonnegative().optional(),
});
export type UpdateTreatPatientsIntervalsAction = Immutable<
    z.infer<typeof updateTreatPatientsIntervalsActionSchema>
>;

const providePersonnelBehaviorUpdateVehiclePrioritiesActionSchema =
    z.strictObject({
        type: z.literal('[ProvidePersonnelBehavior] Update VehiclePriorities'),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        priorities: z.array(uuidSchema), // TODO: are those personnel or vehicle uuids?
    });
export type ProvidePersonnelBehaviorUpdateVehiclePrioritiesAction = Immutable<
    z.infer<typeof providePersonnelBehaviorUpdateVehiclePrioritiesActionSchema>
>;

const unloadArrivingVehiclesBehaviorUpdateUnloadDelayActionSchema =
    z.strictObject({
        type: z.literal('[UnloadArrivingVehiclesBehavior] Update UnloadDelay'),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        unloadDelay: z.number().nonnegative(),
    });
export type UnloadArrivingVehiclesBehaviorUpdateUnloadDelayAction = Immutable<
    z.infer<typeof unloadArrivingVehiclesBehaviorUpdateUnloadDelayActionSchema>
>;

const createReportActionSchema = z.strictObject({
    type: z.literal('[ReportBehavior] Create Report'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    informationType: reportableInformationSchema,
    interfaceSignallerKey: z.string().nullable(), // TODO: test if validator works out
});
export type CreateReportAction = Immutable<
    z.infer<typeof createReportActionSchema>
>;

const updateReportTreatmentStatusChangesActionSchema = z.strictObject({
    type: z.literal('[ReportBehavior] Update report treatment status changes'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    reportChanges: z.boolean(),
});
export type UpdateReportTreatmentStatusChangesAction = Immutable<
    z.infer<typeof updateReportTreatmentStatusChangesActionSchema>
>;

const updateReportTransferOfCategoryInSingleRegionCompletedActionSchema =
    z.strictObject({
        type: z.literal(
            '[ReportBehavior] Update report transfer of category in single region completed'
        ),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        reportChanges: z.boolean(),
    });
export type UpdateReportTransferOfCategoryInSingleRegionCompletedAction =
    Immutable<
        z.infer<
            typeof updateReportTransferOfCategoryInSingleRegionCompletedActionSchema
        >
    >;

const updateReportTransferOfCategoryInMultipleRegionsCompletedActionSchema =
    z.strictObject({
        type: z.literal(
            '[ReportBehavior] Update report transfer of category in multiple regions completed'
        ),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        reportChanges: z.boolean(),
    });
export type UpdateReportTransferOfCategoryInMultipleRegionsCompletedAction =
    Immutable<
        z.infer<
            typeof updateReportTransferOfCategoryInMultipleRegionsCompletedActionSchema
        >
    >;

const createRecurringReportsActionSchema = z.strictObject({
    type: z.literal('[ReportBehavior] Create Recurring Report'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    interval: z.number().nonnegative(),
    informationType: reportableInformationSchema,
});
export type CreateRecurringReportsAction = Immutable<
    z.infer<typeof createRecurringReportsActionSchema>
>;
const updateRecurringReportsActionSchema = z.strictObject({
    type: z.literal('[ReportBehavior] Update Recurring Report'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    interval: z.number().nonnegative(),
    informationType: reportableInformationSchema,
});
export type UpdateRecurringReportsAction = Immutable<
    z.infer<typeof updateRecurringReportsActionSchema>
>;

const removeRecurringReportsActionSchema = z.strictObject({
    type: z.literal('[ReportBehavior] Remove Recurring Report'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    informationType: reportableInformationSchema,
});
export type RemoveRecurringReportsAction = Immutable<
    z.infer<typeof removeRecurringReportsActionSchema>
>;

const changeAutomaticDistributionLimitActionSchema = z.strictObject({
    type: z.literal('[AutomaticDistributionBehavior] Change Limit'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    vehicleType: z.string(), // TODO: narrow?
    newLimit: z.int().nonnegative(),
});

export type ChangeAutomaticDistributionLimitAction = Immutable<
    z.infer<typeof changeAutomaticDistributionLimitActionSchema>
>;

const updateRequestIntervalActionSchema = z.strictObject({
    type: z.literal('[RequestBehavior] Update RequestInterval'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    requestInterval: z.int().nonnegative(),
});

export type UpdateRequestIntervalAction = Immutable<
    z.infer<typeof updateRequestIntervalActionSchema>
>;

const addAutomaticDistributionDestinationActionSchema = z.strictObject({
    type: z.literal('[AutomaticDistributionBehavior] Add Destination'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    destinationId: uuidSchema, // TODO@Felix: what destinations?
});
export type AddAutomaticDistributionDestinationAction = Immutable<
    z.infer<typeof addAutomaticDistributionDestinationActionSchema>
>;

const updateRequestTargetActionSchema = z.strictObject({
    type: z.literal('[RequestBehavior] Update RequestTarget'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    requestTarget: exerciseRequestTargetConfigurationSchema,
});
export type UpdateRequestTargetAction = Immutable<
    z.infer<typeof updateRequestTargetActionSchema>
>;

const removeAutomaticDistributionDestinationActionSchema = z.strictObject({
    type: z.literal('[AutomaticDistributionBehavior] Remove Destination'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    destinationId: uuidSchema, // TODO
});
export type RemoveAutomaticDistributionDestinationAction = Immutable<
    z.infer<typeof removeAutomaticDistributionDestinationActionSchema>
>;

const updatePromiseInvalidationIntervalActionSchema = z.strictObject({
    type: z.literal('[RequestBehavior] Update Promise invalidation interval'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    promiseInvalidationInterval: z.int().nonnegative(),
});
export type UpdatePromiseInvalidationIntervalAction = Immutable<
    z.infer<typeof updatePromiseInvalidationIntervalActionSchema>
>;

const updatePatientLoadTimeActionSchema = z.strictObject({
    type: z.literal('[TransferBehavior] Update Patient Load Time'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    loadTimePerPatient: z.int().nonnegative(),
});
export type UpdatePatientLoadTimeAction = Immutable<
    z.infer<typeof updatePatientLoadTimeActionSchema>
>;

const updatePersonnelLoadTimeActionSchema = z.strictObject({
    type: z.literal('[TransferBehavior] Update Personnel Load Time'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    personnelLoadTime: z.int().nonnegative(),
});
export type UpdatePersonnelLoadTimeAction = Immutable<
    z.infer<typeof updatePersonnelLoadTimeActionSchema>
>;

const updateDelayBetweenSendsActionSchema = z.strictObject({
    type: z.literal('[TransferBehavior] Update Delay Between Sends'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    delayBetweenSends: z.int().nonnegative(),
});
export type UpdateDelayBetweenSendsAction = Immutable<
    z.infer<typeof updateDelayBetweenSendsActionSchema>
>;

const sendTransferRequestEventActionSchema = z.strictObject({
    type: z.literal('[TransferBehavior] Send Transfer Request Event'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    vehicleId: vehicleSchema.shape.id,
    destinationType: transferDestinationTypeSchema,
    destinationId: uuidSchema, // TODO
    patients: uuidSetSchema,
});
export type SendTransferRequestEventAction = Immutable<
    z.infer<typeof sendTransferRequestEventActionSchema>
>;

const transferVehiclesActionSchema = z.strictObject({
    type: z.literal('[TransferBehavior] Transfer Vehicles'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    requestedVehicles: resourceDescriptionSchema,
    destinationType: transferDestinationTypeSchema,
    destinationId: uuidSchema, // TODO
});
export type TransferVehiclesAction = Immutable<
    z.infer<typeof transferVehiclesActionSchema>
>;

const changeTransportRequestTargetActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    requestTargetId: uuidSchema.optional(), // TODO
});
export type ChangeTransportRequestTargetAction = Immutable<
    z.infer<typeof changeTransportRequestTargetActionSchema>
>;

const addSimulatedRegionToManageForTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Add Simulated Region To Manage For Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    managedSimulatedRegionId: simulatedRegionSchema.shape.id,
});
export type AddSimulatedRegionToManageForTransportAction = Immutable<
    z.infer<typeof addSimulatedRegionToManageForTransportActionSchema>
>;

const removeSimulatedRegionToManageFromTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Remove Simulated Region To Manage From Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    managedSimulatedRegionId: simulatedRegionSchema.shape.id,
});
export type RemoveSimulatedRegionToManageFromTransportAction = Immutable<
    z.infer<typeof removeSimulatedRegionToManageFromTransportActionSchema>
>;

const updatePatientsExpectedInRegionForTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Update Patients Expected In Region For Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    managedSimulatedRegionId: simulatedRegionSchema.shape.id,
    patientsExpected: z.int().nonnegative(),
    patientStatus: patientStatusSchema,
});
export type UpdatePatientsExpectedInRegionForTransportAction = Immutable<
    z.infer<typeof updatePatientsExpectedInRegionForTransportActionSchema>
>;

const addVehicleTypeForPatientTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Add Vehicle Type For Patient Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    vehicleTypeName: z.string(), // TODO
    patientStatus: patientStatusForTransportSchema,
});
export type AddVehicleTypeForPatientTransportAction = Immutable<
    z.infer<typeof addVehicleTypeForPatientTransportActionSchema>
>;

const removeVehicleTypeForPatientTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Remove Vehicle Type For Patient Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    vehicleTypeName: z.string(), // TODO
    patientStatus: patientStatusForTransportSchema,
});
export type RemoveVehicleTypeForPatientTransportAction = Immutable<
    z.infer<typeof removeVehicleTypeForPatientTransportActionSchema>
>;

const updateRequestVehicleDelayForPatientTransportActionSchema = z.strictObject(
    {
        type: z.literal(
            '[ManagePatientsTransportToHospitalBehavior] Update Request Vehicle Delay For Patient Transport'
        ),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        requestVehicleDelay: z.int().nonnegative(),
    }
);
export type UpdateRequestVehicleDelayForPatientTransportAction = Immutable<
    z.infer<typeof updateRequestVehicleDelayForPatientTransportActionSchema>
>;

const updateRequestPatientCountDelayForPatientTransportActionSchema =
    z.strictObject({
        type: z.literal(
            '[ManagePatientsTransportToHospitalBehavior] Update Request Patient Count Delay For Patient Transport'
        ),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        requestPatientCountDelay: z.int().nonnegative(),
    });
export type UpdateRequestPatientCountDelayForPatientTransportAction = Immutable<
    z.infer<
        typeof updateRequestPatientCountDelayForPatientTransportActionSchema
    >
>;

const updatePromiseInvalidationIntervalForPatientTransportActionSchema =
    z.strictObject({
        type: z.literal(
            '[ManagePatientsTransportToHospitalBehavior] Update Promise Invalidation Interval For Patient Transport'
        ),
        simulatedRegionId: simulatedRegionSchema.shape.id,
        behaviorId: simulationBehaviorStateSchema.shape.id,
        promiseInvalidationInterval: z.int().nonnegative(),
    });
export type UpdatePromiseInvalidationIntervalForPatientTransportAction =
    Immutable<
        z.infer<
            typeof updatePromiseInvalidationIntervalForPatientTransportActionSchema
        >
    >;

const updateMaximumCategoryToTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
    maximumCategoryToTransport: patientStatusForTransportSchema,
});
export type UpdateMaximumCategoryToTransportAction = Immutable<
    z.infer<typeof updateMaximumCategoryToTransportActionSchema>
>;

const startTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Start Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
});
export type StartTransportAction = Immutable<
    z.infer<typeof startTransportActionSchema>
>;

const stopTransportActionSchema = z.strictObject({
    type: z.literal(
        '[ManagePatientsTransportToHospitalBehavior] Stop Transport'
    ),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
});
export type StopTransportAction = Immutable<
    z.infer<typeof stopTransportActionSchema>
>;

export namespace SimulationActionReducers {
    export const updateTreatPatientsIntervals: ActionReducer<UpdateTreatPatientsIntervalsAction> =
        {
            type: updateTreatPatientsIntervalsActionSchema.shape.type.value,
            actionSchema: updateTreatPatientsIntervalsActionSchema,
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
                ) as WritableDraft<TreatPatientsBehaviorState>;

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
            type: unloadArrivingVehiclesBehaviorUpdateUnloadDelayActionSchema
                .shape.type.value,
            actionSchema:
                unloadArrivingVehiclesBehaviorUpdateUnloadDelayActionSchema,
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
                ) as
                    | WritableDraft<UnloadArrivingVehiclesBehaviorState>
                    | undefined;

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
        type: createReportActionSchema.shape.type.value,
        actionSchema: createReportActionSchema,
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
                newStartCollectingInformationEvent(
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
            type: updateReportTreatmentStatusChangesActionSchema.shape.type
                .value,
            actionSchema: updateReportTreatmentStatusChangesActionSchema,
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
            type: updateReportTransferOfCategoryInSingleRegionCompletedActionSchema
                .shape.type.value,
            actionSchema:
                updateReportTransferOfCategoryInSingleRegionCompletedActionSchema,
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
            type: updateReportTransferOfCategoryInMultipleRegionsCompletedActionSchema
                .shape.type.value,
            actionSchema:
                updateReportTransferOfCategoryInMultipleRegionsCompletedActionSchema,
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
            type: createRecurringReportsActionSchema.shape.type.value,
            actionSchema: createRecurringReportsActionSchema,
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
                    newRecurringEventActivityState(
                        activityId,
                        newStartCollectingInformationEvent(informationType),
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
            type: updateRecurringReportsActionSchema.shape.type.value,
            actionSchema: updateRecurringReportsActionSchema,
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
            type: removeRecurringReportsActionSchema.shape.type.value,
            actionSchema: removeRecurringReportsActionSchema,
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
            type: changeAutomaticDistributionLimitActionSchema.shape.type.value,
            actionSchema: changeAutomaticDistributionLimitActionSchema,
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
                        newLimit < Number.MAX_SAFE_INTEGER
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
            type: updateRequestIntervalActionSchema.shape.type.value,
            actionSchema: updateRequestIntervalActionSchema,
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
            type: addAutomaticDistributionDestinationActionSchema.shape.type
                .value,
            actionSchema: addAutomaticDistributionDestinationActionSchema,
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
            type: updateRequestTargetActionSchema.shape.type.value,
            actionSchema: updateRequestTargetActionSchema,
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
            type: removeAutomaticDistributionDestinationActionSchema.shape.type
                .value,
            actionSchema: removeAutomaticDistributionDestinationActionSchema,
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
            type: updatePromiseInvalidationIntervalActionSchema.shape.type
                .value,
            actionSchema: updatePromiseInvalidationIntervalActionSchema,
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
            type: providePersonnelBehaviorUpdateVehiclePrioritiesActionSchema
                .shape.type.value,
            actionSchema:
                providePersonnelBehaviorUpdateVehiclePrioritiesActionSchema,
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
                        const vehicleType =
                            draftState.vehicleTemplates[priority]!.vehicleType;
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
            type: updatePatientLoadTimeActionSchema.shape.type.value,
            actionSchema: updatePatientLoadTimeActionSchema,
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
            type: updatePersonnelLoadTimeActionSchema.shape.type.value,
            actionSchema: updatePersonnelLoadTimeActionSchema,
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
            type: updateDelayBetweenSendsActionSchema.shape.type.value,
            actionSchema: updateDelayBetweenSendsActionSchema,
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
            type: sendTransferRequestEventActionSchema.shape.type.value,
            actionSchema: sendTransferRequestEventActionSchema,
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
                    event = newTransferSpecificVehicleRequestEvent(
                        vehicleId,
                        destinationType,
                        destinationId,
                        destinationId
                    );
                } else {
                    event = newTransferPatientsInSpecificVehicleRequestEvent(
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
        type: transferVehiclesActionSchema.shape.type.value,
        actionSchema: transferVehiclesActionSchema,
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
                newTransferVehiclesRequestEvent(
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
            type: changeTransportRequestTargetActionSchema.shape.type.value,
            actionSchema: changeTransportRequestTargetActionSchema,
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
            type: addSimulatedRegionToManageForTransportActionSchema.shape.type
                .value,
            actionSchema: addSimulatedRegionToManageForTransportActionSchema,
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
            type: removeSimulatedRegionToManageFromTransportActionSchema.shape
                .type.value,
            actionSchema:
                removeSimulatedRegionToManageFromTransportActionSchema,
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
            type: updatePatientsExpectedInRegionForTransportActionSchema.shape
                .type.value,
            actionSchema:
                updatePatientsExpectedInRegionForTransportActionSchema,
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
            type: addVehicleTypeForPatientTransportActionSchema.shape.type
                .value,
            actionSchema: addVehicleTypeForPatientTransportActionSchema,
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
            type: removeVehicleTypeForPatientTransportActionSchema.shape.type
                .value,
            actionSchema: removeVehicleTypeForPatientTransportActionSchema,
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
            type: updateRequestVehicleDelayForPatientTransportActionSchema.shape
                .type.value,
            actionSchema:
                updateRequestVehicleDelayForPatientTransportActionSchema,
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
            type: updateRequestPatientCountDelayForPatientTransportActionSchema
                .shape.type.value,
            actionSchema:
                updateRequestPatientCountDelayForPatientTransportActionSchema,
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
            type: updatePromiseInvalidationIntervalForPatientTransportActionSchema
                .shape.type.value,
            actionSchema:
                updatePromiseInvalidationIntervalForPatientTransportActionSchema,
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
            type: updateMaximumCategoryToTransportActionSchema.shape.type.value,
            actionSchema: updateMaximumCategoryToTransportActionSchema,
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
        type: startTransportActionSchema.shape.type.value,
        actionSchema: startTransportActionSchema,
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
        type: stopTransportActionSchema.shape.type.value,
        actionSchema: stopTransportActionSchema,
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
