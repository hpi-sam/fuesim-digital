import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
    PatientStatus,
    PatientStatusForTransport,
} from '../../models/utils/index.js';
import {
    PatientTransferOccupation,
    currentSimulatedRegionOf,
    getCreate,
    isInSpecificSimulatedRegion,
    patientStatusAllowedValues,
} from '../../models/utils/index.js';
import type { Mutable, UUID, UUIDSet } from '../../utils/index.js';
import {
    StrictObject,
    cloneDeepMutable,
    uuid,
    uuidValidationOptions,
} from '../../utils/index.js';
import {
    IsLiteralUnion,
    IsUUIDSet,
    IsValue,
} from '../../utils/validators/index.js';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import {
    DelayEventActivityState,
    PublishRadiogramActivityState,
    RecurringEventActivityState,
    SendRemoteEventActivityState,
} from '../activities/index.js';
import {
    AskForPatientDataEvent,
    PatientCategoryTransferToHospitalFinishedEvent,
    TransferVehiclesRequestEvent,
    TryToSendToHospitalEvent,
} from '../events/index.js';
import type { TransferCountsRadiogram } from '../../models/radiogram/index.js';
import { RadiogramUnpublishedStatus } from '../../models/radiogram/index.js';
import { IsPatientsPerUUID } from '../../utils/validators/is-patients-per-uuid.js';
import { NewPatientDataRequestedRadiogram } from '../../models/radiogram/new-patient-data-requested-radiogram.js';
import { CountPatientsActivityState } from '../activities/count-patients.js';
import type { ExerciseState } from '../../state.js';
import {
    getActivityById,
    getElement,
    getElementByPredicate,
} from '../../store/action-reducers/utils/index.js';
import { PatientsTransportPromise } from '../utils/patients-transported-promise.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { addResourceDescription } from '../../models/utils/resource-description.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { IsResourceDescription } from '../../utils/validators/is-resource-description.js';
import { logLastPatientTransportedInMultipleSimulatedRegions } from '../../store/action-reducers/utils/log.js';
import type {
    SimulationBehavior,
    SimulationBehaviorState,
} from './simulation-behavior.js';

interface PatientsPerRegion {
    [simulatedRegionId: UUID]: ResourceDescription<PatientStatus>;
}

class VehiclesForPatients {
    @IsValue('vehiclesForPatients')
    readonly type = 'vehiclesForPatients';

    @IsString({ each: true })
    readonly red: readonly string[] = ['RTW'];

    @IsInt()
    @Min(0)
    readonly redIndex: number = 0;

    @IsString({ each: true })
    readonly yellow: readonly string[] = ['RTW'];

    @IsInt()
    @Min(0)
    readonly yellowIndex: number = 0;

    @IsString({ each: true })
    readonly green: readonly string[] = ['RTW', 'KTW'];

    @IsInt()
    @Min(0)
    readonly greenIndex: number = 0;

    static readonly create = getCreate(this);
}

export class ManagePatientTransportToHospitalBehaviorState
    implements SimulationBehaviorState
{
    @IsValue('managePatientTransportToHospitalBehavior')
    readonly type = 'managePatientTransportToHospitalBehavior';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly requestTargetId?: UUID;

    @IsUUIDSet()
    public readonly simulatedRegionsToManage: UUIDSet = {};

    /**
     * Stores the amount of patients expected in some regions.
     * Regions are NOT removed from this, if they are not managed anymore,
     * as the behavior should still have its knowledge about how many patients
     * are in this region. Therefore, to find the amount of patients in managed
     * regions, one must filter this object to only contain keys that are also
     * in {@link simulatedRegionsToManage}
     */
    @IsPatientsPerUUID()
    public readonly patientsExpectedInRegions: PatientsPerRegion = {};

    @Type(() => PatientsTransportPromise)
    @ValidateNested()
    public readonly patientsExpectedToStillBeTransportedByRegion: readonly PatientsTransportPromise[] =
        [];

    @IsResourceDescription(patientStatusAllowedValues)
    public readonly transferredPatientCounts: ResourceDescription<PatientStatus> =
        {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        };

    @Type(() => VehiclesForPatients)
    @ValidateNested()
    public readonly vehiclesForPatients: VehiclesForPatients =
        VehiclesForPatients.create();

    /**
     * @deprecated Use {@link updateRequestVehiclesDelay} instead
     */
    @IsInt()
    @Min(0)
    public readonly requestVehiclesDelay: number = 60 * 1000;

    /**
     * @deprecated Use {@link updateRequestPatientCountsDelay} instead
     */
    @IsInt()
    @Min(0)
    public readonly requestPatientCountsDelay: number = 15 * 60 * 1000;

    @IsInt()
    @Min(0)
    public readonly promiseInvalidationInterval: number = 30 * 60 * 1000;

    @IsLiteralUnion(patientStatusAllowedValues)
    public readonly maximumCategoryToTransport: PatientStatusForTransport =
        'red';

    @IsBoolean()
    public readonly transportStarted: boolean = false;

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    readonly recurringPatientDataRequestActivityId?: UUID;

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    readonly recurringSendToHospitalActivityId?: UUID;

    static readonly create = getCreate(this);
}

export const managePatientTransportToHospitalBehavior: SimulationBehavior<ManagePatientTransportToHospitalBehaviorState> =
    {
        behaviorState: ManagePatientTransportToHospitalBehaviorState,
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

                    const patientsExpectedInRegions = Object.fromEntries(
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
                            SendRemoteEventActivityState.create(
                                nextUUID(draftState),
                                behaviorState.requestTargetId,
                                TransferVehiclesRequestEvent.create(
                                    { [vehicleType]: 1 },
                                    'transferPoint',
                                    targetTransferPoint.id,
                                    simulatedRegion.id,
                                    undefined,
                                    PatientTransferOccupation.create(
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
                                DelayEventActivityState.create(
                                    nextUUID(draftState),
                                    PatientCategoryTransferToHospitalFinishedEvent.create(
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
                            CountPatientsActivityState.create(
                                nextUUID(draftState)
                            )
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
                            PublishRadiogramActivityState.create(
                                nextUUID(draftState),
                                NewPatientDataRequestedRadiogram.create(
                                    nextUUID(draftState),
                                    simulatedRegion.id,
                                    RadiogramUnpublishedStatus.create()
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
                        const vehicleTemplate =
                            draftState.vehicleTemplates.find(
                                (template) => template.vehicleType === type
                            );

                        return (
                            sum +
                            (vehicleTemplate?.patientCapacity ?? 0) * count
                        );
                    }, 0);

                    behaviorState.patientsExpectedToStillBeTransportedByRegion.push(
                        cloneDeepMutable(
                            PatientsTransportPromise.create(
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
                            ).radiogram as Mutable<TransferCountsRadiogram>;

                            const expectedPatientsPerRegion =
                                Object.fromEntries(
                                    StrictObject.entries(
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
    draftState: Mutable<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>,
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
    draftState: Mutable<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>,
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
    draftState: Mutable<ExerciseState>,
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>
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
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>,
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
    draftState: Mutable<ExerciseState>,
    simulatedRegion: Mutable<SimulatedRegion>,
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>
) {
    if (!behaviorState.recurringPatientDataRequestActivityId) {
        behaviorState.recurringPatientDataRequestActivityId =
            nextUUID(draftState);
        addActivity(
            simulatedRegion,
            RecurringEventActivityState.create(
                behaviorState.recurringPatientDataRequestActivityId,
                AskForPatientDataEvent.create(behaviorState.id),
                draftState.currentTime,
                behaviorState.requestPatientCountsDelay
            )
        );
    }

    if (!behaviorState.recurringSendToHospitalActivityId) {
        behaviorState.recurringSendToHospitalActivityId = nextUUID(draftState);
        addActivity(
            simulatedRegion,
            RecurringEventActivityState.create(
                behaviorState.recurringSendToHospitalActivityId,
                TryToSendToHospitalEvent.create(behaviorState.id),
                draftState.currentTime,
                behaviorState.requestVehiclesDelay
            )
        );
    }
}

function removeActivities(
    draftState: Mutable<ExerciseState>,
    simulatedRegion: Mutable<SimulatedRegion>,
    behaviorState: Mutable<ManagePatientTransportToHospitalBehaviorState>
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
