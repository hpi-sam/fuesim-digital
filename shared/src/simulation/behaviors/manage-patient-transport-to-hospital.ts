import type { WritableDraft } from 'immer';
import { z } from 'zod';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import {
    patientsTransportPromiseSchema,
    newPatientsTransportPromise,
} from '../utils/patients-transported-promise.js';
import { logLastPatientTransportedInMultipleSimulatedRegions } from '../../store/action-reducers/utils/log.js';
import { uuid, type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    type PatientStatus,
    type PatientStatusForTransport,
    patientStatusForTransportSchema,
    patientStatusSchema,
} from '../../models/utils/patient-status.js';
import {
    getActivityById,
    getElement,
    getElementByPredicate,
} from '../../store/action-reducers/utils/get-element.js';
import {
    currentSimulatedRegionOf,
    isInSpecificSimulatedRegion,
} from '../../models/utils/position/position-helpers.js';
import { newSendRemoteEventActivityState } from '../activities/send-remote-event.js';
import { newTransferVehiclesRequestEvent } from '../events/transfer-vehicles-request.js';
import { newPatientTransferOccupation } from '../../models/utils/occupations/patient-transfer-occupation.js';
import { newDelayEventActivityState } from '../activities/delay-event.js';
import { newPatientCategoryTransferToHospitalFinishedEvent } from '../events/patient-category-transfer-to-hospital-finished.js';
import { newCountPatientsActivityState } from '../activities/count-patients.js';
import { newPublishRadiogramActivityState } from '../activities/publish-radiogram.js';
import { newNewPatientDataRequestedRadiogram } from '../../models/radiogram/new-patient-data-requested-radiogram.js';
import { newRadiogramUnpublishedStatus } from '../../models/radiogram/status/radiogram-unpublished-status.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { TransferCountsRadiogram } from '../../models/radiogram/transfer-counts-radiogram.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import {
    addResourceDescription,
    type ResourceDescription,
} from '../../models/utils/resource-description.js';
import type { ExerciseState } from '../../state.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { newRecurringEventActivityState } from '../activities/recurring-event.js';
import { newAskForPatientDataEvent } from '../events/ask-for-patient-data-event.js';
import { newTryToSendToHospitalEvent } from '../events/try-to-send-to-hospital.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';
import type { SimulationBehavior } from './simulation-behavior.js';

interface PatientsPerRegion {
    [simulatedRegionId: UUID]: ResourceDescription<PatientStatus>;
}

const vehiclesForPatientsSchema = z.strictObject({
    type: z.literal('vehiclesForPatients'),
    red: z.array(z.string()),
    redIndex: z.int().nonnegative(),
    yellow: z.array(z.string()),
    yellowIndex: z.int().nonnegative(),
    green: z.array(z.string()),
    greenIndex: z.int().nonnegative(),
});

type VehiclesForPatients = z.infer<typeof vehiclesForPatientsSchema>;

function newVehiclesForPatients(): VehiclesForPatients {
    return {
        type: 'vehiclesForPatients',
        red: ['RTW'],
        redIndex: 0,
        yellow: ['RTW'],
        yellowIndex: 0,
        green: ['RTW', 'KTW'],
        greenIndex: 0,
    };
}

export const managePatientTransportToHospitalBehaviorStateSchema =
    z.strictObject({
        ...simulationBehaviorStateSchema.shape,
        type: z.literal('managePatientTransportToHospitalBehavior'),
        requestTargetId: uuidSchema.optional(),
        simulatedRegionsToManage: z.record(uuidSchema, z.literal(true)),
        /**
         * Stores the amount of patients expected in some regions.
         * Regions are NOT removed from this, if they are not managed anymore,
         * as the behavior should still have its knowledge about how many patients
         * are in this region. Therefore, to find the amount of patients in managed
         * regions, one must filter this object to only contain keys that are also
         * in {@link simulatedRegionsToManage}
         */
        patientsExpectedInRegions: z.record(
            uuidSchema,
            z.record(patientStatusSchema, z.int().nonnegative())
        ),
        patientsExpectedToStillBeTransportedByRegion: z.array(
            patientsTransportPromiseSchema
        ),
        transferredPatientCounts: z.record(
            patientStatusSchema,
            z.int().nonnegative()
        ),
        vehiclesForPatients: vehiclesForPatientsSchema,
        /**
         * @deprecated Use {@link updateRequestVehiclesDelay} instead
         */
        requestVehiclesDelay: z.int().nonnegative(),
        /**
         * @deprecated Use {@link updateRequestPatientCountsDelay} instead
         */
        requestPatientCountsDelay: z.int().nonnegative(),
        promiseInvalidationInterval: z.int().nonnegative(),
        maximumCategoryToTransport: patientStatusForTransportSchema,
        transportStarted: z.boolean(),
        recurringPatientDataRequestActivityId: uuidSchema.optional(),
        recurringSendToHospitalActivityId: uuidSchema.optional(),
    });

export type ManagePatientTransportToHospitalBehaviorState = z.infer<
    typeof managePatientTransportToHospitalBehaviorStateSchema
>;

export function newManagePatientTransportToHospitalBehaviorState(): ManagePatientTransportToHospitalBehaviorState {
    return {
        type: 'managePatientTransportToHospitalBehavior',
        id: uuid(),
        requestTargetId: undefined,
        simulatedRegionsToManage: {},
        patientsExpectedInRegions: {},
        patientsExpectedToStillBeTransportedByRegion: [],
        transferredPatientCounts: {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        },
        vehiclesForPatients: newVehiclesForPatients(),
        requestVehiclesDelay: 60 * 1000,
        requestPatientCountsDelay: 15 * 60 * 1000,
        promiseInvalidationInterval: 30 * 60 * 1000,
        maximumCategoryToTransport: 'red',
        transportStarted: false,
        recurringPatientDataRequestActivityId: undefined,
        recurringSendToHospitalActivityId: undefined,
    };
}

export const managePatientTransportToHospitalBehavior: SimulationBehavior<ManagePatientTransportToHospitalBehaviorState> =
    {
        behaviorStateSchema:
            managePatientTransportToHospitalBehaviorStateSchema,
        newBehaviorState: newManagePatientTransportToHospitalBehaviorState,
        handleEvent: (draftState, simulatedRegion, behaviorState, event) => {
            switch (event.type) {
                case 'tickEvent': {
                    if (behaviorState.transportStarted) {
                        addActivities(
                            draftState,
                            simulatedRegion,
                            behaviorState
                        );
                    } else {
                        removeActivities(
                            draftState,
                            simulatedRegion,
                            behaviorState
                        );
                    }

                    break;
                }
                case 'tryToSendToHospitalEvent': {
                    // only react if this event is meant for this behavior
                    if (
                        event.behaviorId !== behaviorState.id ||
                        !behaviorState.requestTargetId
                    ) {
                        break;
                    }

                    const patientsExpectedInRegions: PatientsPerRegion =
                        Object.fromEntries(
                            Object.entries(
                                patientsExpectedInRegionsAfterTransports(
                                    draftState,
                                    behaviorState
                                )
                            ).filter(
                                ([simulatedRegionId, _]) =>
                                    behaviorState.simulatedRegionsToManage[
                                        simulatedRegionId
                                    ]
                            )
                        );

                    const highestCategoryThatIsNeeded =
                        orderedPatientCategories.find((category) =>
                            Object.values(patientsExpectedInRegions).some(
                                (patientCounts) => patientCounts[category] > 0
                            )
                        );

                    if (
                        !highestCategoryThatIsNeeded ||
                        orderedPatientCategories.indexOf(
                            highestCategoryThatIsNeeded
                        ) >
                            orderedPatientCategories.indexOf(
                                behaviorState.maximumCategoryToTransport
                            )
                    ) {
                        break;
                    }

                    const simulatedRegionIdWithBiggestNeed = Object.entries(
                        patientsExpectedInRegions
                    ).sort(
                        ([, patientCountsA], [, patientCountsB]) =>
                            patientCountsB[highestCategoryThatIsNeeded] -
                            patientCountsA[highestCategoryThatIsNeeded]
                    )[0]![0];

                    const vehicleType = getNextVehicleForPatientStatus(
                        behaviorState,
                        highestCategoryThatIsNeeded
                    );

                    const targetTransferPoint = getElementByPredicate(
                        draftState,
                        'transferPoint',
                        (transferPoint) =>
                            isInSpecificSimulatedRegion(
                                transferPoint,
                                simulatedRegionIdWithBiggestNeed
                            )
                    );

                    if (vehicleType) {
                        addActivity(
                            simulatedRegion,
                            newSendRemoteEventActivityState(
                                nextUUID(draftState),
                                behaviorState.requestTargetId,
                                newTransferVehiclesRequestEvent(
                                    { [vehicleType]: 1 },
                                    'transferPoint',
                                    targetTransferPoint.id,
                                    simulatedRegion.id,
                                    undefined,
                                    newPatientTransferOccupation(
                                        simulatedRegion.id
                                    )
                                )
                            )
                        );
                    }
                    break;
                }

                case 'patientTransferToHospitalSuccessfulEvent': {
                    if (
                        behaviorState.patientsExpectedInRegions[
                            event.patientOriginSimulatedRegion
                        ]
                    ) {
                        behaviorState.patientsExpectedInRegions[
                            event.patientOriginSimulatedRegion
                        ]![event.patientCategory]--;
                        behaviorState.transferredPatientCounts[
                            event.patientCategory
                        ]++;

                        const promiseForThisRegion =
                            behaviorState.patientsExpectedToStillBeTransportedByRegion.find(
                                (promise) =>
                                    promise.targetSimulatedRegionId ===
                                        event.patientOriginSimulatedRegion &&
                                    promise.patientCount > 0
                            );

                        if (promiseForThisRegion) {
                            promiseForThisRegion.patientCount--;
                        }

                        if (
                            Object.values(
                                behaviorState.patientsExpectedInRegions
                            ).every(
                                (patientCount) =>
                                    patientCount[event.patientCategory] === 0
                            )
                        ) {
                            addActivity(
                                simulatedRegion,
                                newDelayEventActivityState(
                                    nextUUID(draftState),
                                    newPatientCategoryTransferToHospitalFinishedEvent(
                                        event.patientCategory,
                                        false
                                    ),
                                    draftState.currentTime
                                )
                            );
                            logLastPatientTransportedInMultipleSimulatedRegions(
                                draftState,
                                event.patientCategory,
                                simulatedRegion.id
                            );
                        }
                    }
                    break;
                }

                case 'askForPatientDataEvent': {
                    // only react if this event is meant for this behavior

                    if (event.behaviorId !== behaviorState.id) {
                        break;
                    }

                    // if it manages its own simulated region initiate a patient count

                    if (
                        behaviorState.simulatedRegionsToManage[
                            simulatedRegion.id
                        ]
                    ) {
                        addActivity(
                            simulatedRegion,
                            newCountPatientsActivityState(nextUUID(draftState))
                        );
                    }

                    if (
                        Object.keys(
                            behaviorState.simulatedRegionsToManage
                        ).some(
                            (simulatedRegionId) =>
                                simulatedRegionId !== simulatedRegion.id
                        )
                    ) {
                        addActivity(
                            simulatedRegion,
                            newPublishRadiogramActivityState(
                                nextUUID(draftState),
                                newNewPatientDataRequestedRadiogram(
                                    nextUUID(draftState),
                                    simulatedRegion.id,
                                    newRadiogramUnpublishedStatus()
                                )
                            )
                        );
                    }
                    break;
                }
                case 'patientsCountedEvent': {
                    behaviorState.patientsExpectedInRegions[
                        simulatedRegion.id
                    ] = event.patientCount;
                    break;
                }
                case 'vehiclesSentEvent': {
                    const transferPoint = getElement(
                        draftState,
                        'transferPoint',
                        event.destinationTransferPointId
                    );
                    const destinationSimulatedRegion = currentSimulatedRegionOf(
                        draftState,
                        transferPoint
                    );

                    const numberOfPatients = Object.entries(
                        event.vehiclesSent.vehicleCounts
                    ).reduce((sum, [type, count]) => {
                        const vehicleTemplate = Object.values(
                            draftState.vehicleTemplates
                        ).find((template) => template.vehicleType === type);

                        return (
                            sum +
                            (vehicleTemplate?.patientCapacity ?? 0) * count
                        );
                    }, 0);

                    behaviorState.patientsExpectedToStillBeTransportedByRegion.push(
                        cloneDeepMutable(
                            newPatientsTransportPromise(
                                draftState.currentTime,
                                numberOfPatients,
                                destinationSimulatedRegion.id
                            )
                        )
                    );
                    break;
                }
                case 'collectInformationEvent': {
                    switch (event.informationType) {
                        case 'transportManagementTransferCounts': {
                            const radiogram = getActivityById(
                                draftState,
                                simulatedRegion.id,
                                event.generateReportActivityId,
                                'generateReportActivity'
                            )
                                .radiogram as WritableDraft<TransferCountsRadiogram>;

                            const expectedPatientsPerRegion =
                                Object.fromEntries(
                                    TypeAssertedObject.entries(
                                        behaviorState.patientsExpectedInRegions
                                    ).filter(
                                        ([regionId]) =>
                                            behaviorState
                                                .simulatedRegionsToManage[
                                                regionId
                                            ]
                                    )
                                );
                            const expectedManagedPatients = Object.values(
                                expectedPatientsPerRegion
                            ).reduce(addResourceDescription, {
                                black: 0,
                                blue: 0,
                                green: 0,
                                red: 0,
                                white: 0,
                                yellow: 0,
                            });

                            radiogram.transferredPatientsCounts =
                                behaviorState.transferredPatientCounts;
                            radiogram.remainingPatientsCounts =
                                expectedManagedPatients;
                            radiogram.scope = 'transportManagement';
                            radiogram.informationAvailable = true;
                            break;
                        }
                        default:
                    }
                    break;
                }
                default:
                // Ignore event
            }
        },
        onRemove(draftState, simulatedRegion, behaviorState) {
            removeActivities(draftState, simulatedRegion, behaviorState);
        },
    };

const orderedPatientCategories: PatientStatusForTransport[] = [
    'red',
    'yellow',
    'green',
];

export function updateRequestVehiclesDelay(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>,
    newDelay: number
) {
    behaviorState.requestVehiclesDelay = newDelay;
    if (behaviorState.recurringSendToHospitalActivityId) {
        const activity = getActivityById(
            draftState,
            simulatedRegionId,
            behaviorState.recurringSendToHospitalActivityId,
            'recurringEventActivity'
        );
        activity.recurrenceIntervalTime = newDelay;
    }
}

export function updateRequestPatientCountsDelay(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>,
    newDelay: number
) {
    behaviorState.requestPatientCountsDelay = newDelay;
    if (behaviorState.recurringPatientDataRequestActivityId) {
        const activity = getActivityById(
            draftState,
            simulatedRegionId,
            behaviorState.recurringPatientDataRequestActivityId,
            'recurringEventActivity'
        );
        activity.recurrenceIntervalTime = newDelay;
    }
}

function patientsExpectedInRegionsAfterTransports(
    draftState: WritableDraft<ExerciseState>,
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>
) {
    behaviorState.patientsExpectedToStillBeTransportedByRegion =
        behaviorState.patientsExpectedToStillBeTransportedByRegion.filter(
            (promise) =>
                promise.promisedTime +
                    behaviorState.promiseInvalidationInterval >
                draftState.currentTime
        );

    const patientsExpectedInRegions = cloneDeepMutable(
        behaviorState.patientsExpectedInRegions
    );

    behaviorState.patientsExpectedToStillBeTransportedByRegion.forEach(
        (promise) => {
            if (patientsExpectedInRegions[promise.targetSimulatedRegionId]) {
                orderedPatientCategories.forEach((category) => {
                    const patientsTransferred = Math.min(
                        patientsExpectedInRegions[
                            promise.targetSimulatedRegionId
                        ]![category],
                        promise.patientCount
                    );

                    patientsExpectedInRegions[promise.targetSimulatedRegionId]![
                        category
                    ] -= patientsTransferred;
                    promise.patientCount -= patientsTransferred;
                });
            }
        }
    );

    return patientsExpectedInRegions;
}

function getNextVehicleForPatientStatus(
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>,
    patientStatus: PatientStatusForTransport
) {
    behaviorState.vehiclesForPatients[`${patientStatus}Index`]++;
    if (
        behaviorState.vehiclesForPatients[`${patientStatus}Index`] >=
        behaviorState.vehiclesForPatients[patientStatus].length
    ) {
        behaviorState.vehiclesForPatients[`${patientStatus}Index`] = 0;
    }

    return behaviorState.vehiclesForPatients[patientStatus][
        behaviorState.vehiclesForPatients[`${patientStatus}Index`]
    ];
}

function addActivities(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>
) {
    if (!behaviorState.recurringPatientDataRequestActivityId) {
        behaviorState.recurringPatientDataRequestActivityId =
            nextUUID(draftState);
        addActivity(
            simulatedRegion,
            newRecurringEventActivityState(
                behaviorState.recurringPatientDataRequestActivityId,
                newAskForPatientDataEvent(behaviorState.id),
                draftState.currentTime,
                behaviorState.requestPatientCountsDelay
            )
        );
    }

    if (!behaviorState.recurringSendToHospitalActivityId) {
        behaviorState.recurringSendToHospitalActivityId = nextUUID(draftState);
        addActivity(
            simulatedRegion,
            newRecurringEventActivityState(
                behaviorState.recurringSendToHospitalActivityId,
                newTryToSendToHospitalEvent(behaviorState.id),
                draftState.currentTime,
                behaviorState.requestVehiclesDelay
            )
        );
    }
}

function removeActivities(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<ManagePatientTransportToHospitalBehaviorState>
) {
    if (behaviorState.recurringPatientDataRequestActivityId) {
        terminateActivity(
            draftState,
            simulatedRegion,
            behaviorState.recurringPatientDataRequestActivityId
        );
        behaviorState.recurringPatientDataRequestActivityId = undefined;
    }

    if (behaviorState.recurringSendToHospitalActivityId) {
        terminateActivity(
            draftState,
            simulatedRegion,
            behaviorState.recurringSendToHospitalActivityId
        );
        behaviorState.recurringSendToHospitalActivityId = undefined;
    }
}
